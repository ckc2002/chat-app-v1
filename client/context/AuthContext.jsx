import { createContext, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { io } from "socket.io-client"
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL = backendUrl


export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"))
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([])
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null)

    const navigate = useNavigate()

    const checkAuth = async () => {
        try {
            const { data } = await axios.post("/api/auth/check")
            if (data.success) {
                setAuthUser(data.user)
                connectSocket(data.user)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Connect socket function to handle socket connection and online users updates
    const connectSocket = (userData) => {
        // if (!userData || socketRef.current) return;

        // socketRef.current = io(backendUrl, {
        //     transports: ["websocket"], // optional but stable
        //     query: {
        //         userId: userData._id
        //     }
        // });

        // socketRef.current.on("connect", () => {
        //     console.log("✅ Socket connected:", socketRef.current.id);
        // });

        // socketRef.current.on("connect_error", (err) => {
        //     console.error("❌ Connection error:", err.message);
        // });

        // socketRef.current.on("getOnlineUsers", (users) => {
        //     setOnlineUsers(users);
        // });

        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: { userId: userData._id }
        });
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on('getOnlineUsers', (users) => { setOnlineUsers(users); });
    };

    // Login function to handle user authentication and socket connection 
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials)
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            } else {
                toast.success(data.message);
            }
        } catch (error) {
            toast.success(error.message);
        }
    }

    // Logout function to handle user logout and socket disconnection
    const logout = () => {
        setAuthUser(null);
        setToken(null);
        setOnlineUsers([]);
        localStorage.removeItem("token");
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully");
        socket?.disconnect();
        setSocket(null);
    }

    // update Profile function to handle user profile updates
    const updateProfile = async (profileData) => {
        try {
            const { data } = await axios.post("/api/auth/update-profile", profileData)
            if (data.success) {
                setAuthUser(data.userData);
                toast.success("Profile Updated Successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token;
        }
        checkAuth()
    }, [])

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile

    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )

}