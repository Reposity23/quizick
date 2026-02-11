import fs from "node:fs";
import multer from "multer";
import path from "node:path";

const uploadDir = path.resolve(process.cwd(), "server", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

export const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${timestamp}-${safeName}`);
    }
  }),
  limits: {
    files: 10,
    fileSize: 20 * 1024 * 1024
  }
});
