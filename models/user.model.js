import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    about: { type: String, default: "Hey there! I am using Chat App." },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
