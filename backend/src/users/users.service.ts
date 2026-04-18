import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { UserIdentity } from '../entities/user-identity.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PatientProfile)
    private readonly patientProfileRepository: Repository<PatientProfile>,
    @InjectRepository(DoctorProfile)
    private readonly doctorProfileRepository: Repository<DoctorProfile>,
    @InjectRepository(UserIdentity)
    private readonly userIdentityRepository: Repository<UserIdentity>,
  ) {}

  async findById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role', 'patientProfile', 'doctorProfile'],
      select: [
        'id',
        'email',
        'phone',
        'fullName',
        'avatarUrl',
        'avatarPublicId',
        'dateOfBirth',
        'gender',
        'status',
        'createdAt',
      ],
    });
  }

  async updateAvatar(userId: string, data: { avatarUrl: string; avatarPublicId: string }) {
    await this.userRepository.update(userId, {
      avatarUrl: data.avatarUrl,
      avatarPublicId: data.avatarPublicId,
    });
  }

  async ensurePatientProfile(userId: string) {
    const existing = await this.patientProfileRepository.findOne({ where: { userId } });
    if (existing) return existing;
    return await this.patientProfileRepository.save(
      this.patientProfileRepository.create({ userId }),
    );
  }

  async ensureDoctorProfile(userId: string) {
    const existing = await this.doctorProfileRepository.findOne({ where: { userId } });
    if (existing) return existing;
    return await this.doctorProfileRepository.save(this.doctorProfileRepository.create({ userId }));
  }

  async updateMe(params: {
    userId: string;
    fullName?: string;
    phone?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    patientProfile?: Partial<Pick<PatientProfile,
      | 'emergencyContactName'
      | 'emergencyContactPhone'
      | 'addressLine'
      | 'provinceCode'
      | 'districtCode'
      | 'wardCode'
      | 'occupation'
      | 'bloodType'
    >>;
    doctorProfile?: Partial<Pick<DoctorProfile,
      | 'professionalTitle'
      | 'licenseNumber'
      | 'yearsOfExperience'
      | 'bio'
      | 'workplaceName'
      | 'consultationFee'
      | 'isAvailableForBooking'
    >>;
  }) {
    const { userId } = params;

    const updateUser: Partial<User> = {};
    if (params.fullName != null) updateUser.fullName = params.fullName;
    if (params.phone !== undefined) updateUser.phone = params.phone;
    if (params.dateOfBirth !== undefined) updateUser.dateOfBirth = params.dateOfBirth;
    if (params.gender !== undefined) updateUser.gender = params.gender;

    if (Object.keys(updateUser).length > 0) {
      await this.userRepository.update(userId, updateUser);
    }

    if (params.patientProfile) {
      await this.ensurePatientProfile(userId);
      await this.patientProfileRepository.update({ userId }, params.patientProfile);
    }

    if (params.doctorProfile) {
      await this.ensureDoctorProfile(userId);
      await this.doctorProfileRepository.update({ userId }, params.doctorProfile);
    }
  }

  async findAuthUser(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId, status: 'active' },
      select: ['id', 'email', 'passwordHash'],
    });
  }

  async hasGoogleIdentity(userId: string): Promise<boolean> {
    const row = await this.userIdentityRepository.findOne({
      where: { userId, provider: 'google' as any },
      select: ['id'],
    });
    return Boolean(row);
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    await this.userRepository.update(userId, { passwordHash });
  }
}
