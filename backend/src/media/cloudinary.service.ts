import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

type UploadResult = {
  secureUrl: string;
  publicId: string;
};

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadAvatar(params: { userId: string; buffer: Buffer }) : Promise<UploadResult> {
    const folder = process.env.CLOUDINARY_AVATAR_FOLDER || 'health-assistant/avatars';
    const publicId = `user_${params.userId}_${Date.now()}`;

    return await new Promise<UploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          overwrite: true,
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'face' },
            { fetch_format: 'auto', quality: 'auto' },
          ],
        },
        (err, result) => {
          if (err || !result?.secure_url || !result.public_id) {
            reject(err ?? new Error('Upload failed'));
            return;
          }
          resolve({ secureUrl: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(params.buffer);
    });
  }

  async destroy(publicId: string): Promise<void> {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch {
      // best-effort cleanup
    }
  }
}

