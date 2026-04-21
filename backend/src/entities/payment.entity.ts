import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ type: 'varchar', length: 30, default: 'momo' })
  provider: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: string;

  @Column({ name: 'provider_order_id', type: 'varchar', length: 100, unique: true })
  providerOrderId: string;

  @Column({ name: 'provider_trans_id', type: 'varchar', length: 100, nullable: true })
  providerTransId: string | null;

  @Column({ name: 'raw_create_response', type: 'text', nullable: true })
  rawCreateResponse: string | null;

  @Column({ name: 'raw_ipn_body', type: 'text', nullable: true })
  rawIpnBody: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}
