import express from 'express';
import upload from '../middleware/upload.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Upload single file
router.post('/single', protect, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return file information
        res.status(200).json({
            success: true,
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: `/uploads/${req.file.filename}`,
                url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'File upload failed', error: error.message });
    }
});

// Upload multiple files
router.post('/multiple', protect, upload.array('files', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Return files information
        const filesInfo = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: `/uploads/${file.filename}`,
            url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
        }));

        res.status(200).json({
            success: true,
            files: filesInfo
        });
    } catch (error) {
        res.status(500).json({ message: 'Files upload failed', error: error.message });
    }
});

export default router;
