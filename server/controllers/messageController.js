import Message from "../models/Message.js"
import User from "../models/User.js"
import cloudinary from "../lib/cloudinary.js"
import { io, userSocketMap } from "../server.js"

// Get all user expect the login user
export const getUserForSidebar = async (req, res) => {
    try {
        const userId = req.user._id
        const filteredUser = await User.find({ _id: { $ne: userId } }).select("-password")

        const unseenMessages = {}
        const promises = filteredUser.map(async (user) => {
            const message = await Message.find({ senderId: user._id, receiverId: userId, seen: false })
            if (message.length > 0) {
                unseenMessages[user._id] = message.length
            }
        })
        await Promise.all(promises)
        res.json({ success: true, users: filteredUser, unseenMessages })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}


// Get all Messages for selected User
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });


        res.json({ success: true, messages })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// API to mark messages as seen using message IDs
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// Send Message to selected User
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const result = await cloudinary.uploader.upload(image);
            imageUrl = result.secure_url;
        }

        const newMessage = await Message.create({ senderId, receiverId, text, image: imageUrl });

        // Emit the new message to the receiver socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        res.json({ success: true, newMessage })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}