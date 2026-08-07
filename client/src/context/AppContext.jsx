import {createContext, useContext, useState,useEffect} from 'react'
import axios from 'axios'
import {useNavigate} from 'react-router-dom'
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const AppContext =createContext();

export const AppProvider = ({children}) => {
      
    const navigate =useNavigate();
    const [token,setToken]=useState(null)
    const [user,setUser]=useState(null)
    const [blogs,setBlogs]=useState([])
    const [input,setInput]=useState("")
    const [socket, setSocket] = useState(null)

    // ---- Blogs ----
    const fetchBlogs =async() => {
        try {
            const {data} = await axios.get('/api/blog/all');
            data.success ? setBlogs(data.blogs) : toast.error(data.message)
        } catch (error) { 
             toast.error(error.message)
        }
    }

    // ---- Logged-in user profile (for navbar avatar) ----
    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/auth/me');
            if (data.success) {
                setUser(data.user);
            }
        } catch (error) {
            // token may be invalid/expired — fail silently here
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
        navigate('/');
    }

    useEffect(() => {
        fetchBlogs();
        const token = localStorage.getItem('token')
        if(token) {
            setToken(token)
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    },[])

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setUser(null);
        }
    }, [token]);

    // ---- Socket.io connection ----
    // Connects once a token exists (mirrors the fetchUser effect above),
    // and is torn down on logout/token loss so a stale connection never
    // lingers under a different (or no) user. Auth happens via the
    // handshake's `auth.token`, matching configs/socket.js on the backend
    // exactly — same JWT, same verification, just delivered differently
    // than a normal REST call since sockets don't have request headers.
    useEffect(() => {
        if (!token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(import.meta.env.VITE_BASE_URL, {
            auth: { token },
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

     const value = {
        axios, navigate, token, setToken, user, setUser, logout,
        blogs, setBlogs , input ,setInput,
        fetchUser, socket
     }

    return (
       
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}


export const useAppContext = () => {
    return useContext(AppContext)
} 
