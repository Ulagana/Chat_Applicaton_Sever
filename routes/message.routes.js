import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { sendMessage, allMessages, addReaction, removeReaction } from '../controllers/message.controller.js';

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);
router.route("/:messageId/reaction").post(protect, addReaction);
router.route("/:messageId/reaction/:emoji").delete(protect, removeReaction);

export default router;
