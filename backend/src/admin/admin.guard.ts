import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as User;
    const codes =
      user?.userRoles?.map((ur) => ur.role?.code).filter((c): c is string => Boolean(c)) || [];
    if (!codes.includes('admin')) {
      throw new ForbiddenException('Chỉ quản trị viên mới được truy cập');
    }
    return true;
  }
}
