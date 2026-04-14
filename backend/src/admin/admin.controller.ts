import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { RejectPostDto } from './dto/reject-post.dto';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(AdminGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/summary')
  dashboardSummary() {
    return this.adminService.dashboardSummary();
  }

  @Get('users')
  listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listUsers(page, limit);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Get('doctors/pending')
  listPendingDoctors() {
    return this.adminService.listPendingDoctors();
  }

  @Patch('doctors/:userId/approve')
  approveDoctor(@Param('userId') userId: string) {
    return this.adminService.approveDoctor(userId);
  }

  @Patch('doctors/:userId/reject')
  rejectDoctor(@Param('userId') userId: string) {
    return this.adminService.rejectDoctor(userId);
  }

  @Get('posts/pending')
  listPendingPosts() {
    return this.adminService.listPendingPosts();
  }

  @Patch('posts/:id/approve')
  approvePost(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: User) {
    return this.adminService.approvePost(id, admin.id);
  }

  @Patch('posts/:id/reject')
  rejectPost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: User,
    @Body() dto: RejectPostDto,
  ) {
    return this.adminService.rejectPost(id, admin.id, dto.reason);
  }

  @Get('specialties')
  listSpecialties() {
    return this.adminService.listSpecialties();
  }

  @Post('specialties')
  createSpecialty(@Body() dto: CreateSpecialtyDto) {
    return this.adminService.createSpecialty(dto);
  }

  @Patch('specialties/:id')
  updateSpecialty(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSpecialtyDto) {
    return this.adminService.updateSpecialty(id, dto);
  }

  @Patch('specialties/:id/status')
  setSpecialtyStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { status: 'active' | 'inactive' },
  ) {
    return this.adminService.setSpecialtyStatus(id, dto.status);
  }
}
