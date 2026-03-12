import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';
import { instanceToPlain } from 'class-transformer';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: User) {
    const u = await this.usersService.findById(user.id);
    if (!u) return null;
    const roles = u.userRoles?.map((ur) => ur.role?.code).filter(Boolean) || [];
    return {
      ...instanceToPlain(u),
      roles,
    };
  }
}
