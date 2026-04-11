import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Danh sách chuyên khoa (form đăng ký bác sĩ). */
  @Public()
  @Get('specialties')
  listSpecialtiesForRegister() {
    return this.authService.listActiveSpecialties();
  }
}
