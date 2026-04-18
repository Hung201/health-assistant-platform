import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { DoctorPostsService } from './doctor-posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

// Có thể dùng RolesGuard nếu thiết lập, hoặc DoctorPortalController đã check role. Thường module doctor nên có Guard check role doctor.
// Tạm thời ở đây dựa trên @CurrentUser(), user.role (từ jwt) sẽ xác định. 

@Controller('doctor/posts')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DoctorPostsController {
  constructor(private readonly doctorPostsService: DoctorPostsService) {}

  @Post()
  createPost(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.doctorPostsService.createPost(user, dto);
  }

  @Get()
  myPosts(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.doctorPostsService.getMyPosts(user, page, limit);
  }

  @Get(':id')
  myPostDetail(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.doctorPostsService.getMyPostDetail(user, id);
  }

  @Patch(':id')
  updatePost(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    return this.doctorPostsService.updatePost(user, id, dto);
  }

  @Delete(':id')
  deletePost(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.doctorPostsService.deletePost(user, id);
  }
}
