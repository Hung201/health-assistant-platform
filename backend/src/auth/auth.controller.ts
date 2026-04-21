import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyPatientEmailDto } from './dto/verify-patient-email.dto';
import { ResendPatientEmailCodeDto } from './dto/resend-patient-email-code.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { GoogleAuthUser } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    if (result.access_token) {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
    return {
      ok: true,
      requiresEmailVerification: result.requiresEmailVerification ?? false,
      email: result.email ?? undefined,
    };
  }

  @Public()
  @Post('register/patient/verify-email')
  async verifyPatientEmail(@Body() dto: VerifyPatientEmailDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyPatientEmail(dto);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true };
  }

  @Public()
  @Post('register/patient/resend-code')
  async resendPatientCode(@Body() dto: ResendPatientEmailCodeDto) {
    await this.authService.resendPatientEmailCode(dto);
    return { ok: true };
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport will redirect to Google.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user?: GoogleAuthUser; query?: Record<string, unknown> },
    @Res() res: Response,
  ) {
    const result = await this.authService.loginWithGoogle(req.user as GoogleAuthUser);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const stateRaw = typeof req.query?.state === 'string' ? req.query.state : '';
    const next = stateRaw ? decodeURIComponent(stateRaw) : '';
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3001';
    const dest = `${frontend}/oauth/google${next ? `?next=${encodeURIComponent(next)}` : ''}`;
    return res.redirect(dest);
  }

  /** Danh sách chuyên khoa (form đăng ký bác sĩ). */
  @Public()
  @Get('specialties')
  listSpecialtiesForRegister() {
    return this.authService.listActiveSpecialties();
  }
}
