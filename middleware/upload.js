import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// File filter to accept various file types
const fileFilter = (req, file, cb) => {
    // Allowed file extensions
    const allowedExts = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|mp4|avi|mov|mkv|webm|mp3|wav|m4a|zip|rar|7z/;
    // Check extension
    const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
    // Check mime type (allow broad categories)
    const mimetype =
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype.startsWith('audio/') ||
        file.mimetype.startsWith('text/') ||
        file.mimetype === 'application/pdf' ||
        file.mimetype.includes('msword') ||
        file.mimetype.includes('officedocument') ||
        file.mimetype.includes('zip') ||
        file.mimetype.includes('compressed') ||
        file.mimetype.includes('csv') ||
        file.mimetype.includes('excel') ||
        file.mimetype.includes('spreadsheet') ||
        file.mimetype.includes('powerpoint') ||
        file.mimetype.includes('presentation');

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error(`Invalid file type provided. (${file.mimetype})`));
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    fileFilter: fileFilter
});

export default upload;
