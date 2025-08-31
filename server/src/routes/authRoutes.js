import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.js';
import { login, register, me, logout, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';
// Multer setup for avatar upload
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const r = Router();
// Multer local storage (same as userRoutes.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.mimetype)) return cb(new Error('Only images allowed'));
    cb(null, true);
  }
});

r.post('/register', authLimiter, upload.single('avatar'), register);
r.post('/login', authLimiter, login);
r.get('/me', authRequired, me);
r.post('/logout', authRequired, logout);
r.post('/request-reset', requestPasswordReset);
r.post('/reset-password', resetPassword);

export default r;
