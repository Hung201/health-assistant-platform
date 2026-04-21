import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** MoMo gọi server-to-server — body động, không whitelist. */
  @Public()
  @Post('momo/ipn')
  @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true }))
  async momoIpn(@Body() body: Record<string, string | number | undefined>) {
    return this.paymentsService.handleMomoIpn(body);
  }
}
