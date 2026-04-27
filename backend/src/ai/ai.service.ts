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
    const aiBaseUrl = this.config.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    const patientContext = await this.buildPatientContext(currentUser);

    const response = await fetch(`${aiBaseUrl.replace(/\/$/, '')}/api/v1/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: dto.session_id ?? null,
        message: dto.message,
        history: [],
        user_location: dto.user_location ?? null,
        user_id: currentUser.id,
        patient_context: patientContext,
      }),
    }).catch((error: unknown) => {
      throw new BadGatewayException(
        error instanceof Error ? error.message : 'Khong the ket noi AI service',
      );
    });

    const data = (await response.json().catch(() => null)) as any;
    if (!response.ok) {
      throw new BadGatewayException({
        message: 'AI service tra ve loi',
        statusCode: response.status,
        detail: data,
      });
    }

    const locationHint = this.buildLocationHint(dto.message, dto.user_location, data?.hospital_suggestion);

    // Process doctor recommendation if there's a suggested specialty
    const suggestedSpecialty = data?.final_result?.top_diseases?.[0]?.suggested_specialty;
    if (suggestedSpecialty && typeof suggestedSpecialty === 'string') {
      const spec = await this.findBestSpecialty(suggestedSpecialty);
      if (spec) {
        let recommendedDoctors = await this.doctorsService.recommendDoctors({
          specialtyId: Number(spec.id),
          limit: 3,
          locationHint,
          workplaceQuery: locationHint,
        });

        // Fallback: nếu chưa có bác sĩ có slot trống, vẫn trả bác sĩ đã duyệt theo chuyên khoa
        // để UI không bị rỗng hoàn toàn.
        if (!recommendedDoctors || recommendedDoctors.length === 0) {
          const fallback = await this.doctorsService.listPublicDoctors({
            specialtyId: Number(spec.id),
            page: 1,
            limit: 3,
          });
          recommendedDoctors = fallback.items;
        }

        // Fallback 2: chuyên khoa hiện chưa có bác sĩ trong DB -> trả top bác sĩ public
        if (!recommendedDoctors || recommendedDoctors.length === 0) {
          const broadFallback = await this.doctorsService.listPublicDoctors({
            page: 1,
            limit: 3,
          });
          recommendedDoctors = broadFallback.items;
        }

        data.doctor_recommendations = recommendedDoctors;
      }
    }

    if (data?.final_result && !this.hasRecommendationSelectionIntent(dto.message)) {
      const recommendationPrompt =
        'Bạn muốn tôi gợi ý Bác sĩ uy tín (kèm thông tin bác sĩ và địa chỉ khám) hay các bệnh viện, phòng khám gần bạn?';
      if (typeof data.reply === 'string' && !data.reply.includes('Bạn muốn tôi gợi ý Bác sĩ uy tín')) {
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
        label: 'Gợi ý bác sĩ uy tín',
        message: 'Tôi muốn được gợi ý bác sĩ uy tín phù hợp với tình trạng hiện tại.',
      },
      {
        id: 'facility',
        label: 'Bệnh viện/phòng khám gần tôi',
        message: 'Tôi muốn xem các bệnh viện, phòng khám gần tôi.',
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

    const locationRegex = /\b(?:ở|o|tại|tai)\s+([^.!?]+)/iu;
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
      return (
        normalizedName.includes(normalizedSuggested) || normalizedSuggested.includes(normalizedName)
      );
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
    this.logger.log(`Fetching sessions for user: ${userId}`);
    return this.sessionRepo.find({
      where: [
        { userId },
        { userId: IsNull() } // Tam thoi lay ca session NULL de hien thi du lieu cu
      ],
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
