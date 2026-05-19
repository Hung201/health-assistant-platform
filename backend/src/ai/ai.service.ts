import { randomUUID } from 'crypto';
import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';

import { DoctorsService } from '../doctors/doctors.service';
import { ChronicCondition } from '../entities/chronic-condition.entity';
import { MedicalProfile } from '../entities/medical-profile.entity';
import { PatientChronicCondition } from '../entities/patient-chronic-condition.entity';
import { Specialty } from '../entities/specialty.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { User } from '../entities/user.entity';
import { AiChatDto } from './dto/ai-chat.dto';

type PatientContextPayload = {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height_cm?: number;
  weight_kg?: number;
  chronic_conditions?: string[];
};

type RecommendationOption = {
  id: 'doctor' | 'facility';
  label: string;
  message: string;
};

type AiProviderMode = 'legacy' | 'python_shadow' | 'python_primary';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly specialtySynonyms: Array<{ keywords: string[]; slugs: string[] }> = [
    { keywords: ['rang ham mat', 'nha khoa', 'dau rang', 'sau rang', 'rang'], slugs: ['rang-ham-mat', 'tai-mui-hong', 'ngoai-khoa', 'noi-tong-quat'] },
    { keywords: ['co xuong khop', 'xuong khop', 'cot song', 'thoat vi', 'dau lung'], slugs: ['co-xuong-khop', 'ngoai-khoa', 'than-kinh'] },
    { keywords: ['tim mach', 'huyet ap', 'nhip tim'], slugs: ['tim-mach', 'noi-tong-quat'] },
    { keywords: ['ho hap', 'phoi', 'viem phe quan', 'hen'], slugs: ['ho-hap', 'noi-tong-quat'] },
    { keywords: ['tieu hoa', 'da day', 'ruot', 'gan mat'], slugs: ['tieu-hoa', 'noi-tong-quat'] },
    { keywords: ['than kinh', 'dau dau', 'te bi'], slugs: ['than-kinh', 'noi-tong-quat'] },
    { keywords: ['da lieu', 'di ung da', 'mun', 'eczema'], slugs: ['da-lieu', 'noi-tong-quat'] },
    { keywords: ['san phu khoa', 'phu khoa', 'thai ky', 'kinh nguyet'], slugs: ['san-phu-khoa', 'noi-tong-quat'] },
    { keywords: ['tai mui hong', 'viem xoang', 'dau hong'], slugs: ['tai-mui-hong', 'noi-tong-quat'] },
    { keywords: ['nhi khoa', 'tre em', 'nhi'], slugs: ['nhi-khoa', 'noi-tong-quat'] },
    { keywords: ['nhan khoa', 'mat', 'thi luc'], slugs: ['nhan-khoa', 'noi-tong-quat'] },
  ];

  constructor(
    private readonly config: ConfigService,
    private readonly doctorsService: DoctorsService,
    @InjectRepository(MedicalProfile)
    private readonly medicalProfileRepo: Repository<MedicalProfile>,
    @InjectRepository(PatientChronicCondition)
    private readonly patientConditionRepo: Repository<PatientChronicCondition>,
    @InjectRepository(Specialty)
    private readonly specialtyRepo: Repository<Specialty>,
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  async chat(currentUser: User, dto: AiChatDto) {
    const traceId = randomUUID();
    const aiBaseUrl = (this.config.get<string>('AI_SERVICE_URL') || 'http://localhost:8000').replace(/\/$/, '');
    const provider = this.resolveProviderMode();
    const patientContext = await this.buildPatientContext(currentUser);

    const session = await this.getOrCreateSession(currentUser, dto.session_id, dto.message);
    await this.saveMessage(session.id, 'user', dto.message);
    const persistedLocationHint = this.normalizeHint(session.metadata?.last_location_hint);

    const requestPayload = {
      session_id: session.id,
      message: dto.message,
      history: [],
      user_location: dto.user_location ?? persistedLocationHint ?? null,
      user_id: currentUser.id,
      patient_context: patientContext,
    };

    const primaryPath = '/v1/chat/';
    const legacyPath = '/api/v1/chat/';

    let data: any;
    try {
      if (provider === 'python_primary') {
        data = await this.callPythonChat(aiBaseUrl, primaryPath, requestPayload, traceId);
      } else {
        data = await this.callPythonChat(aiBaseUrl, legacyPath, requestPayload, traceId);
        if (provider === 'python_shadow') {
          this.callPythonChat(aiBaseUrl, primaryPath, requestPayload, traceId)
            .then((shadowData) => this.logShadowCompare(traceId, data, shadowData))
            .catch((error: unknown) => {
              this.logger.warn(`[AI shadow][${traceId}] shadow call failed: ${error instanceof Error ? error.message : 'unknown error'}`);
            });
        }
      }
    } catch (error: unknown) {
      this.logger.error(`[AI gateway][${traceId}] provider failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      data = this.buildSafeFallback(session.id);
    }

    data = await this.enrichAndNormalizeResponse(
      data,
      dto.message,
      dto.user_location ?? persistedLocationHint ?? null,
      session.metadata?.last_final_result ?? null,
    );
    data.session_id = session.id;

    await this.saveMessage(session.id, 'assistant', data?.reply ?? 'Xin loi, toi dang gap truc trac ky thuat.');
    await this.updateSessionStats(
      session,
      dto.message,
      data?.reply,
      data?.telemetry,
      provider,
      data?.final_result ?? null,
      this.buildLocationHint(
        dto.message,
        dto.user_location ?? persistedLocationHint ?? null,
        data?.hospital_suggestion,
      ) ?? null,
    );

    return data;
  }

  private buildSafeFallback(sessionId: string): Record<string, unknown> {
    return {
      session_id: sessionId,
      reply: 'Xin loi, toi dang gap truc trac ky thuat. Vui long thu lai sau giay lat!',
      is_ready_to_diagnose: false,
      final_result: null,
      doctor_recommendations: [],
      recommendation_options: null,
      hospital_suggestion: null,
      telemetry: { provider: 'fallback' },
    };
  }

  private resolveProviderMode(): AiProviderMode {
    const raw = (this.config.get<string>('AI_PROVIDER') || 'legacy').trim().toLowerCase();
    if (raw === 'python_primary' || raw === 'python_shadow' || raw === 'legacy') return raw;
    return 'legacy';
  }

  private async getOrCreateSession(user: User, sessionId: string | undefined, firstMessage: string): Promise<ChatSession> {
    if (sessionId) {
      const existing = await this.sessionRepo.findOne({ where: { id: sessionId } });
      if (existing) {
        if (existing.userId == null) {
          existing.userId = user.id;
          return this.sessionRepo.save(existing);
        }
        if (existing.userId === user.id) {
          return existing;
        }
      }
    }

    const titleRaw = (firstMessage || '').trim();
    const title = titleRaw.length > 0 ? (titleRaw.length > 80 ? `${titleRaw.slice(0, 80)}...` : titleRaw) : 'Cuoc tro chuyen moi';
    const created = this.sessionRepo.create({
      userId: user.id,
      title,
      isActive: true,
      totalTokens: 0,
      metadata: {},
    });
    return this.sessionRepo.save(created);
  }

  private async saveMessage(sessionId: string, role: string, content: string): Promise<void> {
    const msg = this.messageRepo.create({
      sessionId,
      role,
      content,
      tokenCount: this.estimateTokens(content),
    });
    await this.messageRepo.save(msg);
  }

  private async updateSessionStats(
    session: ChatSession,
    userMessage: string,
    assistantReply: string,
    telemetry: any,
    provider: AiProviderMode,
    finalResult: any,
    locationHint: string | null,
  ): Promise<void> {
    const userTokens = this.estimateTokens(userMessage);
    const replyTokens = this.estimateTokens(assistantReply);
    session.totalTokens = (session.totalTokens ?? 0) + userTokens + replyTokens;
    session.metadata = {
      ...(session.metadata ?? {}),
      ai_provider: provider,
      last_telemetry: telemetry ?? null,
      last_final_result: finalResult ?? session.metadata?.last_final_result ?? null,
      last_location_hint: locationHint ?? session.metadata?.last_location_hint ?? null,
      updated_at: new Date().toISOString(),
    };
    await this.sessionRepo.save(session);
  }

  private estimateTokens(text?: string | null): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  private async callPythonChat(
    aiBaseUrl: string,
    path: string,
    payload: Record<string, unknown>,
    traceId: string,
  ): Promise<any> {
    const timeoutMs = Number(this.config.get<string>('AI_TIMEOUT_MS') || 15000);
    const maxAttempts = 2;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${aiBaseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-trace-id': traceId,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timer);

        const data = (await response.json().catch(() => null)) as any;
        if (!response.ok) {
          throw new BadGatewayException({
            message: 'AI service tra ve loi',
            statusCode: response.status,
            detail: data,
            traceId,
          });
        }
        return data;
      } catch (error: unknown) {
        clearTimeout(timer);
        lastError = error;
        if (error instanceof Error) {
          this.logger.warn(`[AI gateway][${traceId}] attempt ${attempt}/${maxAttempts} failed: ${error.name} ${error.message}`);
        }
        const shouldRetry = attempt < maxAttempts && this.isRetryableError(error);
        if (!shouldRetry) break;
      }
    }

    throw new BadGatewayException({
      message: 'Khong the ket noi AI service',
      detail: lastError instanceof Error ? lastError.message : 'unknown error',
      traceId,
    });
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof BadGatewayException) return false;
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return msg.includes('fetch') || msg.includes('abort') || msg.includes('timeout') || msg.includes('network');
    }
    return false;
  }

  private logShadowCompare(traceId: string, legacyData: any, shadowData: any): void {
    const legacySpec = legacyData?.final_result?.top_diseases?.[0]?.suggested_specialty ?? null;
    const shadowSpec = shadowData?.final_result?.top_diseases?.[0]?.suggested_specialty ?? null;
    const legacyLocation = legacyData?.hospital_suggestion?.location_used ?? null;
    const shadowLocation = shadowData?.telemetry?.location_hint_used ?? shadowData?.hospital_suggestion?.location_used ?? null;
    this.logger.log(
      `[AI shadow][${traceId}] legacy.specialty=${legacySpec} shadow.specialty=${shadowSpec} legacy.location=${legacyLocation} shadow.location=${shadowLocation}`,
    );
  }

  private async enrichAndNormalizeResponse(
    data: any,
    message: string,
    userLocation?: string | null,
    sessionFinalResult?: any,
  ): Promise<any> {
    if (!data || typeof data !== 'object') {
      return {
        reply: 'Xin loi, toi dang gap truc trac ky thuat. Vui long thu lai sau giay lat!',
        is_ready_to_diagnose: false,
      };
    }

    const locationHint = this.buildLocationHint(message, userLocation, data?.hospital_suggestion);
    const suggestedSpecialty =
      data?.final_result?.top_diseases?.[0]?.suggested_specialty ??
      sessionFinalResult?.top_diseases?.[0]?.suggested_specialty ??
      null;
    const hasDoctorIntent = this.hasDoctorRecommendationIntent(message);
    if ((suggestedSpecialty && typeof suggestedSpecialty === 'string') || (hasDoctorIntent && locationHint)) {
      const spec = suggestedSpecialty ? await this.findBestSpecialty(suggestedSpecialty) : null;
      if (spec) {
        let recommendedDoctors = await this.doctorsService.recommendDoctors({
          specialtyId: Number(spec.id),
          limit: 3,
          locationHint,
          workplaceQuery: locationHint,
          allowCrossProvinceFallback: false,
        });

        if (!recommendedDoctors || recommendedDoctors.length === 0) {
          const fallback = await this.doctorsService.listPublicDoctors({
            specialtyId: Number(spec.id),
            page: 1,
            limit: 3,
            locationHint,
            workplaceQuery: locationHint,
          });
          recommendedDoctors = fallback.items;
        }

        if ((!recommendedDoctors || recommendedDoctors.length === 0) && locationHint) {
          const locationFallback = await this.doctorsService.listPublicDoctors({
            page: 1,
            limit: 3,
            workplaceQuery: locationHint,
            locationHint,
          });
          recommendedDoctors = locationFallback.items;
        }

        if (!recommendedDoctors || recommendedDoctors.length === 0) {
          const broadFallback = await this.doctorsService.listPublicDoctors({
            page: 1,
            limit: 3,
          });
          recommendedDoctors = broadFallback.items;
        }

        data.doctor_recommendations = recommendedDoctors;
      } else if (hasDoctorIntent && locationHint) {
        const localFallback = await this.doctorsService.listPublicDoctors({
          page: 1,
          limit: 3,
          workplaceQuery: locationHint,
          locationHint,
        });
        data.doctor_recommendations = localFallback.items;
      }
    }

    if (data?.final_result && !this.hasRecommendationSelectionIntent(message)) {
      const recommendationPrompt =
        'Ban muon toi goi y Bac si uy tin (kem thong tin bac si va dia chi kham) hay cac benh vien, phong kham gan ban?';
      if (typeof data.reply === 'string' && !this.normalizeText(data.reply).includes('goi y bac si uy tin')) {
        data.reply = `${data.reply}\n\n${recommendationPrompt}`;
      }
      data.recommendation_options = this.buildRecommendationOptions();
    }

    return data;
  }

  private buildRecommendationOptions(): RecommendationOption[] {
    return [
      {
        id: 'doctor',
        label: 'Goi y bac si uy tin',
        message: 'Toi muon duoc goi y bac si uy tin phu hop voi tinh trang hien tai.',
      },
      {
        id: 'facility',
        label: 'Benh vien/phong kham gan toi',
        message: 'Toi muon xem cac benh vien, phong kham gan toi.',
      },
    ];
  }

  private hasRecommendationSelectionIntent(message?: string | null): boolean {
    const normalized = this.normalizeText(message);
    if (!normalized) return false;
    const doctorIntentKeywords = ['goi y bac si', 'bac si uy tin', 'dat lich bac si', 'tim bac si'];
    const facilityIntentKeywords = ['benh vien', 'phong kham', 'co so y te', 'gan toi', 'gan ban'];
    return (
      doctorIntentKeywords.some((k) => normalized.includes(k)) ||
      facilityIntentKeywords.some((k) => normalized.includes(k))
    );
  }

  private hasDoctorRecommendationIntent(message?: string | null): boolean {
    const normalized = this.normalizeText(message);
    if (!normalized) return false;
    const doctorIntentKeywords = ['goi y bac si', 'bac si uy tin', 'dat lich bac si', 'tim bac si'];
    return doctorIntentKeywords.some((k) => normalized.includes(k));
  }

  private buildLocationHint(
    message: string,
    userLocation?: string | null,
    hospitalSuggestion?: { location_used?: string | null } | null,
  ): string | undefined {
    const cleanUserLocation = this.normalizeHint(userLocation);
    if (cleanUserLocation) return cleanUserLocation;
    const fromMessage = this.extractLocationFromMessage(message);
    if (fromMessage) return fromMessage;
    const hospitalLocation = this.normalizeHint(hospitalSuggestion?.location_used);
    return hospitalLocation || undefined;
  }

  private extractLocationFromMessage(message?: string | null): string | undefined {
    const text = this.normalizeHint(message);
    if (!text) return undefined;
    const locationRegex = /\b(?:o|ở|tai|tại)\s+([^.!?]+)/iu;
    const match = text.match(locationRegex);
    if (!match?.[1]) return undefined;
    return this.normalizeHint(match[1]) || undefined;
  }

  private normalizeHint(value?: string | null): string | null {
    const text = (value ?? '').trim().replace(/\s+/g, ' ');
    return text.length > 0 ? text : null;
  }

  private normalizeText(value?: string | null): string {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async findBestSpecialty(suggestedSpecialty: string): Promise<Specialty | null> {
    const direct = await this.specialtyRepo.findOne({
      where: { name: ILike(`%${suggestedSpecialty}%`), status: 'active' },
    });
    if (direct) return direct;

    const allActive = await this.specialtyRepo.find({ where: { status: 'active' } });
    if (!allActive.length) return null;

    const normalizedSuggested = this.normalizeText(suggestedSpecialty);
    const byName = allActive.find((s) => {
      const normalizedName = this.normalizeText(s.name);
      return normalizedName.includes(normalizedSuggested) || normalizedSuggested.includes(normalizedName);
    });
    if (byName) return byName;

    const synonymRule = this.specialtySynonyms.find((rule) =>
      rule.keywords.some((keyword) => normalizedSuggested.includes(keyword)),
    );
    if (!synonymRule) return null;

    for (const slug of synonymRule.slugs) {
      const match = allActive.find((s) => s.slug === slug);
      if (match) return match;
    }
    return null;
  }

  async getSessions(userId: string) {
    return this.sessionRepo.find({
      where: [{ userId }, { userId: IsNull() }],
      order: { updatedAt: 'DESC' },
    });
  }

  async getSessionMessages(sessionId: string) {
    return this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  private async buildPatientContext(user: User): Promise<PatientContextPayload | null> {
    const context: PatientContextPayload = {};

    const age = this.calculateAge(user.dateOfBirth);
    if (age != null) context.age = age;

    const gender = this.normalizeGender(user.gender);
    if (gender) context.gender = gender;

    const medicalProfile = await this.medicalProfileRepo.findOne({
      where: { patientUserId: user.id },
    });
    if (medicalProfile?.heightCm != null) context.height_cm = Number(medicalProfile.heightCm);
    if (medicalProfile?.weightKg != null) context.weight_kg = Number(medicalProfile.weightKg);

    const conditionLinks = await this.patientConditionRepo.find({
      where: { patientUserId: user.id },
      relations: ['condition'],
    });
    const chronicConditions = conditionLinks
      .map((link) => (link.condition as ChronicCondition | undefined)?.name)
      .filter((name): name is string => Boolean(name));
    if (chronicConditions.length > 0) context.chronic_conditions = chronicConditions;

    return Object.keys(context).length > 0 ? context : null;
  }

  private calculateAge(dateOfBirth: Date | string | null | undefined): number | undefined {
    if (!dateOfBirth) return undefined;
    const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return undefined;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age >= 1 && age <= 120 ? age : undefined;
  }

  private normalizeGender(gender: string | null | undefined): PatientContextPayload['gender'] {
    if (!gender) return undefined;
    const value = gender.toLowerCase();
    if (value === 'male' || value === 'female' || value === 'other') return value;
    if (value === 'nam') return 'male';
    if (value === 'nu' || value === 'nữ') return 'female';
    return 'other';
  }
}
