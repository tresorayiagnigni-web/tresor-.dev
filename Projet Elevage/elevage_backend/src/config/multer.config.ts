import { diskStorage } from 'multer';
import { Request } from 'express';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

const uploadDirectories: Record<string, string> = {
  avatar: 'users',
  animalPhoto: 'animals',
  farmPhoto: 'farms',
};

export const multerConfig = {
  storage: diskStorage({
    destination: (
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void,
    ) => {
      const folder = uploadDirectories[file.fieldname] || 'others';

      const uploadPath = join(process.cwd(), 'uploads', folder);

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      callback(null, uploadPath);
    },

    filename: (
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const extension = extname(file.originalname).toLowerCase();

      callback(null, `${randomUUID()}${extension}`);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException('Format accepté : JPEG, PNG ou WEBP'),
        false,
      );
    }

    callback(null, true);
  },
};
