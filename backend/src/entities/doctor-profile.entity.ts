import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'professional_title', type: 'varchar', length: 255, nullable: true })
  professionalTitle: string | null;

  @Column({ name: 'license_number', type: 'varchar', length: 100, nullable: true })
  licenseNumber: string | null;

  @Column({ name: 'years_of_experience', type: 'int', nullable: true })
  yearsOfExperience: number | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'workplace_name', type: 'varchar', length: 255, nullable: true })
  workplaceName: string | null;

  @Column({ name: 'workplace_address', type: 'text', nullable: true })
  workplaceAddress: string | null;

  @Column({ name: 'province_code', type: 'varchar', length: 120, nullable: true })
  provinceCode: string | null;

  @Column({ name: 'district_code', type: 'varchar', length: 120, nullable: true })
  districtCode: string | null;

  @Column({ name: 'ward_code', type: 'varchar', length: 120, nullable: true })
  wardCode: string | null;

  @Column({ name: 'consultation_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  consultationFee: string;

  @Column({ name: 'priority_score', type: 'int', default: 0 })
  priorityScore: number;

  @Column({ name: 'is_available_for_booking', type: 'boolean', default: true })
  isAvailableForBooking: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_status', type: 'varchar', length: 20, default: 'pending' })
  verificationStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
