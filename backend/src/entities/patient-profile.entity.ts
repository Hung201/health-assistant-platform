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

@Entity('patient_profiles')
export class PatientProfile {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'emergency_contact_name', type: 'varchar', length: 255, nullable: true })
  emergencyContactName: string | null;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 20, nullable: true })
  emergencyContactPhone: string | null;

  @Column({ name: 'address_line', type: 'text', nullable: true })
  addressLine: string | null;

  @Column({ name: 'province_code', type: 'varchar', length: 20, nullable: true })
  provinceCode: string | null;

  @Column({ name: 'district_code', type: 'varchar', length: 20, nullable: true })
  districtCode: string | null;

  @Column({ name: 'ward_code', type: 'varchar', length: 20, nullable: true })
  wardCode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  occupation: string | null;

  @Column({ name: 'blood_type', type: 'varchar', length: 10, nullable: true })
  bloodType: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
