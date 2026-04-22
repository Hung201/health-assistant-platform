import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '../../entities/user.entity';

@Injectable()
export class DoctorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as User;
    const codes =
      user?.userRoles?.map((ur) => ur.role?.code).filter((c): c is string => Boolean(c)) || [];
    if (!codes.includes('doctor')) {
      throw new ForbiddenException('Chỉ bác sĩ mới được truy cập');
    }
    return true;
  }
}
