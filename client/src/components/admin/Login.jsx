import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const Login = () => {
    const { axios, setToken } = useAppContext();
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName]         = useState("");
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading]   = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
            const payload  = isRegister ? { name, email, password } : { email, password };

            const { data } = await axios.post(endpoint, payload);

            if (data.success) {
                setToken(data.token);
                localStorage.setItem("token", data.token);
                // ✅ Send Bearer token in all future requests
                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

                toast.success(isRegister ? "Registered successfully!" : "Login successful!");

                // ✅ Redirect based on role
                data.role === "admin" ? navigate("/admin") : navigate("/");

            } else {
                toast.error(data.message || "Something went wrong.");

                // ✅ Auto switch to login if user already exists
                if (data.redirectToLogin) {
                    setIsRegister(false);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="relative w-full max-w-sm p-6 bg-white bg-opacity-70 backdrop-blur-md border border-primary/30 shadow-xl shadow-primary/15 rounded-lg overflow-hidden">
                <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r from-primary via-pink-500 to-purple-500 opacity-40 animate-[spin_6s_linear_infinite]" />

                <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="w-full py-6 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-wide">
                            <span className="text-primary">{isRegister ? "Register" : "Login"}</span>
                        </h1>
                        <p className="font-light">
                            {isRegister ? "Create your QuillSpace account." : "Welcome back to QuillSpace."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 w-full">
                        {/* Name field — only on register */}
                        {isRegister && (
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold text-gray-700 mb-2">Name</label>
                                <input
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                    type="text"
                                    placeholder="Your Full Name"
                                    className="p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition hover:shadow-md"
                                    required
                                />
                            </div>
                        )}

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email"
                                placeholder="Your Email Id"
                                className="p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition hover:shadow-md"
                                required
                            />
                        </div>

                        <div className="flex flex-col relative">
                            <label className="text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                type={showPassword ? "text" : "password"}
                                placeholder="Your Password"
                                className="p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition hover:shadow-md pr-10"
                                required
                            />
                            <div
                                className="absolute right-3 top-[38px] cursor-pointer text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                            </div>
                        </div>

                        <button
                            className={`relative w-full py-3 font-medium bg-primary text-white rounded-md shadow-md cursor-pointer overflow-hidden group transition-all duration-200 transform ${
                                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-primary/90 hover:scale-[1.02]"
                            }`}
                            type="submit"
                            disabled={loading}
                        >
                            <span className="relative z-10">
                                {loading ? (isRegister ? "Registering..." : "Logging in...") : (isRegister ? "Register" : "Login")}
                            </span>
                            <span className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 transition" />
                        </button>
                    </form>

                    {/* ✅ Toggle between login and register */}
                    <p className="mt-4 text-sm text-gray-600">
                        {isRegister ? "Already have an account?" : "Don't have an account?"}
                        <span
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-primary font-semibold cursor-pointer ml-1"
                        >
                            {isRegister ? "Login" : "Register"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;