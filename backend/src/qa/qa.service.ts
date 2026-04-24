import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DoctorQuestion } from '../entities/doctor-question.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

const QA_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  ANSWERED: 'answered',
  REJECTED: 'rejected',
} as const;

function hasRole(user: User, code: string): boolean {
  return Boolean(user.userRoles?.some((ur) => ur.role?.code === code));
}

function mapQuestionRow(q: DoctorQuestion) {
  return {
    id: q.id,
    title: q.title,
    content: q.questionContent,
    category: q.category,
    status: q.status,
    answerContent: q.answerContent,
    answeredAt: q.answeredAt ? q.answeredAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    patient: {
      id: q.patientUserId,
      fullName: q.patientUser?.fullName ?? 'Bệnh nhân',
      avatarUrl: q.patientUser?.avatarUrl ?? null,
    },
    doctor: q.doctorUserId
      ? {
          id: q.doctorUserId,
          fullName: q.doctorUser?.fullName ?? 'Bác sĩ',
          avatarUrl: q.doctorUser?.avatarUrl ?? null,
        }
      : null,
  };
}

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(DoctorQuestion)
    private readonly questionRepo: Repository<DoctorQuestion>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listPublic(page = 1, limit = 20, category?: string) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.patientUser', 'patientUser')
      .leftJoinAndSelect('q.doctorUser', 'doctorUser')
      .where('q.status IN (:...publicStatuses)', {
        publicStatuses: [QA_STATUS.APPROVED, QA_STATUS.ANSWERED],
      })
      .orderBy('q.answeredAt', 'DESC', 'NULLS LAST')
      .addOrderBy('q.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (category && category.trim() !== '') {
      qb.andWhere('q.category = :category', { category: category.trim() });
    }

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map(mapQuestionRow),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async getPublicDetail(id: string) {
    const q = await this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.patientUser', 'patientUser')
      .leftJoinAndSelect('q.doctorUser', 'doctorUser')
      .where('q.id = :id', { id })
      .andWhere('q.status IN (:...publicStatuses)', {
        publicStatuses: [QA_STATUS.APPROVED, QA_STATUS.ANSWERED],
      })
      .getOne();
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');
    return mapQuestionRow(q);
  }

  async createQuestion(user: User, input: { title: string; content: string; category?: string }) {
    if (!hasRole(user, 'patient')) {
      throw new ForbiddenException('Chỉ bệnh nhân mới có thể gửi câu hỏi');
    }
    const row = await this.questionRepo.save(
      this.questionRepo.create({
        patientUserId: user.id,
        doctorUserId: null,
        title: input.title.trim(),
        questionContent: input.content.trim(),
        category: input.category?.trim() || null,
        status: QA_STATUS.PENDING_REVIEW,
        answerContent: null,
        answeredAt: null,
      }),
    );
    const full = await this.questionRepo.findOne({
      where: { id: row.id },
      relations: ['patientUser', 'doctorUser'],
    });
    if (!full) throw new NotFoundException('Không tìm thấy câu hỏi');
    return mapQuestionRow(full);
  }

  async listDoctorInbox(user: User, page = 1, limit = 20, status?: string) {
    if (!hasRole(user, 'doctor')) throw new ForbiddenException('Chỉ bác sĩ mới truy cập được');
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.patientUser', 'patientUser')
      .leftJoinAndSelect('q.doctorUser', 'doctorUser')
      .where('q.status IN (:...doctorStatuses)', {
        doctorStatuses: [QA_STATUS.APPROVED, QA_STATUS.ANSWERED],
      })
      .orderBy('q.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (status === 'pending' || status === QA_STATUS.APPROVED) {
      qb.andWhere('q.status = :status', { status: QA_STATUS.APPROVED });
    } else if (status === QA_STATUS.ANSWERED) {
      qb.andWhere('q.status = :status', { status: QA_STATUS.ANSWERED });
    }

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map(mapQuestionRow),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async answerQuestion(user: User, questionId: string, answerContent: string) {
    if (!hasRole(user, 'doctor')) {
      throw new ForbiddenException('Chỉ bác sĩ mới được trả lời');
    }
    const q = await this.questionRepo.findOne({
      where: { id: questionId },
      relations: ['patientUser', 'doctorUser'],
    });
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');
    if (q.status !== QA_STATUS.APPROVED) {
      throw new BadRequestException('Câu hỏi chưa được admin duyệt hoặc đã xử lý');
    }

    q.status = QA_STATUS.ANSWERED;
    q.answerContent = answerContent.trim();
    q.answeredAt = new Date();
    q.doctorUserId = user.id;
    await this.questionRepo.save(q);

    await this.notificationsService.createForUser({
      userId: q.patientUserId,
      type: 'qa_answered',
      title: 'Câu hỏi của bạn đã được bác sĩ trả lời',
      message: `Bác sĩ ${user.fullName} vừa trả lời: ${q.title}`,
      priority: 'normal',
      link: `/hoi-bac-si-mien-phi/${q.id}`,
      metadata: { questionId: q.id },
    });

    const fresh = await this.questionRepo.findOne({
      where: { id: q.id },
      relations: ['patientUser', 'doctorUser'],
    });
    if (!fresh) throw new NotFoundException('Không tìm thấy câu hỏi');
    return mapQuestionRow(fresh);
  }
}
