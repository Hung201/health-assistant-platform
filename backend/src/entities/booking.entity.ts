import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PatientProfile } from './patient-profile.entity';
import { DoctorProfile } from './doctor-profile.entity';
import { Specialty } from './specialty.entity';
import { DoctorAvailableSlot } from './doctor-available-slot.entity';
import { User } from './user.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_code', type: 'varchar', length: 30, unique: true })
  bookingCode: string;

  @Column({ name: 'patient_user_id', type: 'uuid', nullable: true })
  patientUserId: string | null;

  @Column({ name: 'doctor_user_id', type: 'uuid' })
  doctorUserId: string;

  @Column({ name: 'specialty_id', type: 'bigint' })
  specialtyId: number;

  @Column({ name: 'available_slot_id', type: 'bigint', nullable: true })
  availableSlotId: number | null;

  @Column({ name: 'patient_note', type: 'text', nullable: true })
  patientNote: string | null;

  @Column({ name: 'doctor_note', type: 'text', nullable: true })
  doctorNote: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 30, default: 'momo' })
  paymentMethod: string;

  @Column({ name: 'payment_status', type: 'varchar', length: 30, default: 'unpaid' })
  paymentStatus: string;

  @Column({ name: 'guest_full_name', type: 'varchar', length: 255, nullable: true })
  guestFullName: string | null;

  @Column({ name: 'guest_phone', type: 'varchar', length: 30, nullable: true })
  guestPhone: string | null;

  @Column({ name: 'guest_email', type: 'varchar', length: 255, nullable: true })
  guestEmail: string | null;

  @Column({ name: 'guest_lookup_token', type: 'varchar', length: 64, nullable: true, unique: true })
  guestLookupToken: string | null;

  @Column({ name: 'appointment_date', type: 'date' })
  appointmentDate: Date;

  @Column({ name: 'appointment_start_at', type: 'timestamptz' })
  appointmentStartAt: Date;

  @Column({ name: 'appointment_end_at', type: 'timestamptz' })
  appointmentEndAt: Date;

  @Column({ name: 'doctor_name_snapshot', type: 'varchar', length: 255 })
  doctorNameSnapshot: string;

  @Column({ name: 'specialty_name_snapshot', type: 'varchar', length: 255 })
  specialtyNameSnapshot: string;

  @Column({ name: 'consultation_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  consultationFee: string;

  @Column({ name: 'platform_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  platformFee: string;

  @Column({ name: 'total_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalFee: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => PatientProfile, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'patient_user_id' })
  patient: PatientProfile | null;

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_user_id' })
  doctor: DoctorProfile;

  @ManyToOne(() => Specialty)
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;

  @ManyToOne(() => DoctorAvailableSlot, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'available_slot_id' })
  availableSlot: DoctorAvailableSlot | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User | null;
}
