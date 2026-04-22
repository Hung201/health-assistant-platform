import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { DoctorsService } from '../doctors/doctors.service';
import { ChronicCondition } from '../entities/chronic-condition.entity';
import { MedicalProfile } from '../entities/medical-profile.entity';
import { PatientChronicCondition } from '../entities/patient-chronic-condition.entity';
import { Specialty } from '../entities/specialty.entity';
import { User } from '../entities/user.entity';
import { AiChatDto } from './dto/ai-chat.dto';

type PatientContextPayload = {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height_cm?: number;
  weight_kg?: number;
  chronic_conditions?: string[];
};

@Injectable()
export class AiService {
  constructor(
    private readonly config: ConfigService,
    private readonly doctorsService: DoctorsService,
    @InjectRepository(MedicalProfile)
    private readonly medicalProfileRepo: Repository<MedicalProfile>,
    @InjectRepository(PatientChronicCondition)
    private readonly patientConditionRepo: Repository<PatientChronicCondition>,
    @InjectRepository(Specialty)
    private readonly specialtyRepo: Repository<Specialty>,
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

    // Process doctor recommendation if there's a suggested specialty
    const suggestedSpecialty = data?.final_result?.top_diseases?.[0]?.suggested_specialty;
    if (suggestedSpecialty && typeof suggestedSpecialty === 'string') {
      const spec = await this.specialtyRepo.findOne({
        where: { name: ILike(`%${suggestedSpecialty}%`), status: 'active' },
      });
      if (spec) {
        const recommendedDoctors = await this.doctorsService.recommendDoctors(Number(spec.id), 3);
        data.doctor_recommendations = recommendedDoctors;
      }
    }

    return data;
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
