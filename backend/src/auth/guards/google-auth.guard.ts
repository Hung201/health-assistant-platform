import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request & { query?: Record<string, unknown> }>();
    const next = typeof req.query?.next === 'string' ? req.query.next : '';
    // "state" round-trips through Google and comes back in callback query.
    // Encode to keep it safe as a single string.
    const state = next ? encodeURIComponent(next) : '';
    return { scope: ['email', 'profile'], state };
  }
}

