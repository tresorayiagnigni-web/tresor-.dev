import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Dossier racine des uploads (à la racine du backend)
export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const AVATARS_DIR = join(UPLOADS_DIR, 'avatars');

// Crée le dossier s'il n'existe pas
if (!existsSync(AVATARS_DIR)) {
  mkdirSync(AVATARS_DIR, { recursive: true });
}

export const multerConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
    filename: (_req, file, cb) => {
      // Nom unique pour éviter les collisions
      const ext = extname(file.originalname).toLowerCase();
      const filename = `${uuidv4()}${ext}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 Mo max
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Format non supporté. Formats acceptés : jpg, png, webp.",
        ) as any,
        false,
      );
    }
  },
};