import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { CommentReaction } from '../entities/comment-reaction.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(CommentReaction)
    private readonly reactionRepo: Repository<CommentReaction>,
  ) {}

  async listPublishedPosts(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    
    // Status = published
    const [posts, total] = await this.postRepo.findAndCount({
      where: { status: 'published' },
      relations: ['author', 'author.user'],
      order: { publishedAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      items: posts.map((p) => ({
        id: String(p.id),
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        thumbnailUrl: p.thumbnailUrl,
        postType: p.postType,
        viewCount: p.viewCount,
        publishedAt: p.publishedAt,
        authorName: p.author?.user?.fullName ?? 'Bác sĩ',
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async getPublishedPostBySlug(slug: string) {
    const post = await this.postRepo.findOne({
      where: { slug, status: 'published' },
      relations: ['author', 'author.user'],
    });

    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    
    // Tăng view count (ở thực tế có thể dùng query raw cập nhật cho nhanh)
    await this.postRepo.increment({ id: post.id }, 'viewCount', 1);

    return {
      id: String(post.id),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      thumbnailUrl: post.thumbnailUrl,
      postType: post.postType,
      viewCount: Number(post.viewCount) + 1,
      publishedAt: post.publishedAt,
      authorName: post.author?.user?.fullName ?? 'Bác sĩ',
      authorId: post.authorUserId,
    };
  }

  async listCommentsBySlug(slug: string, currentUserId?: string) {
    const post = await this.postRepo.findOne({ where: { slug, status: 'published' }, select: ['id'] });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    // Fetch all comments for this post
    const comments = await this.commentRepo.find({
      where: { postId: post.id, status: 'visible' },
      relations: ['user', 'reactions'], // Eager load user and reactions
      order: { createdAt: 'ASC' }, // Older first, then build tree
    });

    // Build the tree
    const commentMap = new Map<number, any>();
    const roots: any[] = [];

    for (const c of comments) {
      const likesCount = c.reactions?.filter(r => r.type === 'like').length || 0;
      const isLikedByMe = currentUserId ? c.reactions?.some(r => r.userId === currentUserId && r.type === 'like') : false;

      const structured = {
        id: String(c.id),
        content: c.content,
        createdAt: c.createdAt,
        user: {
          id: c.userId,
          fullName: c.user?.fullName ?? 'Ẩn danh',
          avatarUrl: c.user?.avatarUrl,
        },
        likesCount,
        isLikedByMe,
        replies: [],
      };
      commentMap.set(Number(c.id), structured);
      
      if (!c.parentCommentId) {
        roots.push(structured);
      } else {
        const parent = commentMap.get(Number(c.parentCommentId));
        if (parent) {
          parent.replies.push(structured);
        } else {
          // If parent not found (deleted?), treat as root
          roots.push(structured);
        }
      }
    }

    return roots;
  }

  async addComment(user: User, slug: string, content: string, parentCommentId?: number) {
    if (!content || !content.trim()) throw new BadRequestException('Nội dung bình luận không được rỗng');
    
    const post = await this.postRepo.findOne({ where: { slug, status: 'published' }, select: ['id'] });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    if (parentCommentId) {
      const parent = await this.commentRepo.findOne({ where: { id: parentCommentId, postId: post.id } });
      if (!parent) throw new BadRequestException('Bình luận cha không tồn tại');
    }

    const comment = this.commentRepo.create({
      postId: post.id,
      userId: user.id,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      status: 'visible',
    });

    await this.commentRepo.save(comment);

    return {
      id: String(comment.id),
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      likesCount: 0,
      isLikedByMe: false,
      replies: [],
    };
  }

  async toggleReaction(user: User, commentId: number) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

    let reaction = await this.reactionRepo.findOne({ where: { commentId, userId: user.id } });

    if (reaction) {
      // Nếu đã có => unlike (Xóa reaction)
      await this.reactionRepo.remove(reaction);
      return { liked: false };
    } else {
      // Nếu chưa có => like
      reaction = this.reactionRepo.create({
        commentId,
        userId: user.id,
        type: 'like',
      });
      await this.reactionRepo.save(reaction);
      return { liked: true };
    }
  }
}
