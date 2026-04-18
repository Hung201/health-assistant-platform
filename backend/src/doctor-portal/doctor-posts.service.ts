import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class DoctorPostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  private generateSlug(title: string): string {
    // Basic slugify if we don't have a lib
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    return `${slug}-${Math.random().toString(36).substring(2, 8)}`;
  }

  async createPost(user: User, dto: CreatePostDto) {
    const slug = this.generateSlug(dto.title);
    
    // Bác sĩ là author, liên kết tới doctor_profiles bảng
    const post = this.postRepo.create({
      ...dto,
      slug,
      authorUserId: user.id,
    });
    
    await this.postRepo.save(post);
    return { ok: true, id: String(post.id) };
  }

  async getMyPosts(user: User, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    
    const [posts, total] = await this.postRepo.findAndCount({
      where: { authorUserId: user.id },
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      items: posts.map((p) => ({
        id: String(p.id),
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        status: p.status,
        postType: p.postType,
        viewCount: p.viewCount,
        createdAt: p.createdAt,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async getMyPostDetail(user: User, id: number) {
    const post = await this.postRepo.findOne({
      where: { id, authorUserId: user.id },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    
    return {
      id: String(post.id),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      thumbnailUrl: post.thumbnailUrl,
      postType: post.postType,
      status: post.status,
      rejectionReason: post.rejectionReason,
      createdAt: post.createdAt,
    };
  }

  async updatePost(user: User, id: number, dto: UpdatePostDto) {
    const post = await this.postRepo.findOne({
      where: { id, authorUserId: user.id },
    });
    
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    
    // Nếu bài viết đã được approved (published), không cho sửa tự do (hoặc phải chuyển về status `pending_review` lại, tạm thời ko cho sửa published)
    if (post.status === 'published') {
      throw new BadRequestException('Không thể sửa bài viết đã đăng. Hãy gỡ bài xuống nếu muốn chỉnh sửa.');
    }

    if (dto.title) {
      post.title = dto.title;
      // Optional: Regenerate slug? Usually we keep it the same for SEO, but here it's fine.
    }
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.thumbnailUrl !== undefined) post.thumbnailUrl = dto.thumbnailUrl;
    if (dto.postType) post.postType = dto.postType;
    if (dto.status) post.status = dto.status;

    await this.postRepo.save(post);
    return { ok: true, id: String(post.id) };
  }

  async deletePost(user: User, id: number) {
    const post = await this.postRepo.findOne({
      where: { id, authorUserId: user.id },
    });
    
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    
    // Không cho xóa nếu đang pending hoặc publishing (quy tắc tùy nghiệp vụ, ở đây tạm khóa list)
    if (post.status === 'published') {
      throw new BadRequestException('Không thể xóa bài viết đã xuất bản.');
    }

    await this.postRepo.remove(post);
    return { ok: true };
  }
}
