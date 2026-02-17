import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';

// Send a message
export const sendMessage = async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
    };

    try {
        var message = await Message.create(newMessage);

        message = await message.populate("sender", "username avatar");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "username avatar email",
        });

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message,
        });

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// Fetch all messages for a chat
export const allMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "username avatar email")
            .populate("reactions.user", "username avatar")
            .populate("chat");

        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// Add reaction to a message
export const addReaction = async (req, res) => {
    const { emoji } = req.body;
    const { messageId } = req.params;

    if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
    }

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
            r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
        );

        if (existingReaction) {
            return res.status(400).json({ message: "Already reacted with this emoji" });
        }

        message.reactions.push({
            user: req.user._id,
            emoji: emoji
        });

        await message.save();

        const updatedMessage = await Message.findById(messageId)
            .populate("sender", "username avatar email")
            .populate("reactions.user", "username avatar")
            .populate("chat");

        res.json(updatedMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Remove reaction from a message
export const removeReaction = async (req, res) => {
    const { messageId, emoji } = req.params;

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        message.reactions = message.reactions.filter(
            r => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji)
        );

        await message.save();

        const updatedMessage = await Message.findById(messageId)
            .populate("sender", "username avatar email")
            .populate("reactions.user", "username avatar")
            .populate("chat");

        res.json(updatedMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

