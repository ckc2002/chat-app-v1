import cloudinary from "../lib/cloudinary.js"
import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"


// Signup a New User
export const signup = async (req, res) => {
    const { fullName, email, bio, password } = req.body

    try {
        if (!fullName || !email || !password) {
            return res.json({ success: false, message: "Missing Details" })
        }

        const user = await User.findOne({ email })
        if (user) {
            return res.json({ success: false, message: "User Already Exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        })

        const token = generateToken(newUser._id)
        res.json({ success: true, userData: newUser, token, message: "User Created Successfully" })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })

    }
}


// Login User
export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const userData = await User.findOne({ email })

        const isPasswordCorrect = await bcrypt.compare(password, userData.password)

        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid Credentials" })
        }

        const token = generateToken(userData._id)
        res.json({ success: true, userData, token, message: "Login Successful" })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: "Invalid Credentials" })
    }
}


// To user if user is authenticated
export const checkAuth = async (req, res) => {
    res.json({ success: true, user: req.user })
}

// To Update User Profile Details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;

        const userId = req.user._id
        let updateUser;

        if (!profilePic) {
            updateUser = await User.findByIdAndUpdate(userId, { fullName, bio }, { new: true })
        } else {

            const upload = await cloudinary.uploader.upload(profilePic);
            updateUser = await User.findByIdAndUpdate(userId, { fullName, bio, profilePic: upload.secure_url }, { new: true })
        }

        res.json({ success: true, userData: updateUser, message: "Profile Details Updated Successfully" })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}