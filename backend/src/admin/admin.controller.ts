import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Request } from 'express';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { RejectPostDto } from './dto/reject-post.dto';
import { AdminUpdatePostDto } from './dto/admin-update-post.dto';
import { AdminUpdateQuestionDto } from './dto/admin-update-question.dto';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/summary')
  dashboardSummary(@Query('days') days?: string) {
    const parsedDays = days ? Number(days) : undefined;
    return this.adminService.dashboardSummary(Number.isFinite(parsedDays) ? parsedDays : undefined);
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
  async updateUser(@Param('id') id: string, @Req() req: Request) {
    const dto = plainToInstance(UpdateUserDto, req.body ?? {});
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      throw new BadRequestException(messages.length > 0 ? messages : errors);
    }
    return this.adminService.updateUser(id, dto);
  }

  @Get('doctors/pending')
  listPendingDoctors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listPendingDoctors(page, limit);
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
  listPendingPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listPendingPosts(page, limit);
  }

  @Get('posts')
  listPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.listPosts(page, limit, status);
  }

  @Get('posts/:id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPostDetail(id);
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

  @Patch('posts/:id')
  updatePost(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdatePostDto) {
    return this.adminService.updatePost(id, dto);
  }

  @Patch('posts/:id/hide')
  hidePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.hidePost(id);
  }

  @Patch('posts/:id/publish')
  publishPost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.publishPost(id);
  }

  @Get('questions/pending')
  listPendingQuestions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listPendingQuestions(page, limit);
  }

  @Get('questions')
  listQuestions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.listQuestions(page, limit, status);
  }

  @Get('questions/:id')
  getQuestion(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.getQuestionDetail(id);
  }

  @Patch('questions/:id/approve')
  approveQuestion(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.approveQuestion(id);
  }

  @Patch('questions/:id/reject')
  rejectQuestion(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: RejectPostDto) {
    return this.adminService.rejectQuestion(id, dto.reason);
  }

  @Patch('questions/:id')
  updateQuestion(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AdminUpdateQuestionDto) {
    return this.adminService.updateQuestion(id, dto);
  }

  @Patch('questions/:id/hide')
  hideQuestion(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.hideQuestion(id);
  }

  @Patch('questions/:id/publish')
  publishQuestion(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.publishQuestion(id);
  }

  @Get('specialties')
  listSpecialties(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listSpecialties(page, limit);
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
