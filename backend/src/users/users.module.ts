import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { UserIdentity } from '../entities/user-identity.entity';
import { CloudinaryService } from '../media/cloudinary.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, PatientProfile, UserIdentity])],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService],
})
export class UsersModule {}
