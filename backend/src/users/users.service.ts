import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role'],
      select: [
        'id',
        'email',
        'phone',
        'fullName',
        'avatarUrl',
        'dateOfBirth',
        'gender',
        'status',
        'createdAt',
      ],
    });
  }
}
