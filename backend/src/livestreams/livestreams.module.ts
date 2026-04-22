import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveStream } from '../entities/live-stream.entity';
import { User } from '../entities/user.entity';
import { DoctorLivestreamsController } from './doctor-livestreams.controller';
import { LivestreamsPublicController } from './livestreams-public.controller';
import { LivestreamsService } from './livestreams.service';

@Module({
  imports: [TypeOrmModule.forFeature([LiveStream, User])],
  controllers: [LivestreamsPublicController, DoctorLivestreamsController],
  providers: [LivestreamsService],
  exports: [LivestreamsService],
})
export class LivestreamsModule {}
