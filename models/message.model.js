import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, enum: ['text', 'image', 'file', 'voice'], default: 'text' },
    fileUrl: { type: String, default: "" },
    duration: { type: Number }, // For voice messages
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, required: true }
    }]
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
