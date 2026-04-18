import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { PostsService } from './posts.service';
import { IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Bình luận không được để trống' })
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  parentCommentId?: number;
}

@Controller('posts')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.listPublishedPosts(page, limit);
  }

  @Public()
  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.postsService.getPublishedPostBySlug(slug);
  }

  @Public()
  @Get(':slug/comments')
  listComments(@Req() req: any, @Param('slug') slug: string) {
    // If the user happens to have JWT, we can extract their ID to show "isLikedByMe". 
    // Wait, @Public bypasses JwtGuard unless requested or handled.
    // If we want optional auth, we'd still need Jwt token in request, but nestjs handle it via OptionalJwtGuard.
    // Assuming simple fallback:
    let currentUserId = undefined;
    if (req.user && req.user.id) {
      currentUserId = req.user.id;
    }
    return this.postsService.listCommentsBySlug(slug, currentUserId);
  }

  @Post(':slug/comments')
  addComment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(user, slug, dto.content, dto.parentCommentId);
  }

  @Post('comments/:id/react')
  toggleReaction(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postsService.toggleReaction(user, id);
  }
}
