import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';

@Entity('booking_status_logs')
export class BookingStatusLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'old_status', type: 'varchar', length: 20, nullable: true })
  oldStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 20 })
  newStatus: string;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedByUser: User | null;
}
