import express from 'express';
import { registerUser, loginUser, allUsers } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', protect, allUsers);

export default router;
