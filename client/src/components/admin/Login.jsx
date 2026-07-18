import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
    const { axios, setToken } = useAppContext();
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName]         = useState("");
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading]   = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuthSuccess = (data, defaultSuccessMessage) => {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

        toast.success(data.message || defaultSuccessMessage);

        data.role === "admin" ? navigate("/admin") : navigate("/");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
            const payload  = isRegister ? { name, email, password } : { email, password };

            const { data } = await axios.post(endpoint, payload);

            if (data.success) {
                handleAuthSuccess(data, isRegister ? "Registered successfully!" : "Login successful!");
            } else {
                toast.error(data.message || "Something went wrong.");

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

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const { data } = await axios.post("/api/auth/google", {
                credential: credentialResponse.credential,
                mode: isRegister ? "register" : "login",
            });

            if (data.success) {
                handleAuthSuccess(data, "Signed in with Google!");
            } else {
                toast.error(data.message || "Google sign-in failed.");
                if (data.redirectToLogin) {
                    setIsRegister(false);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-[Outfit]">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500&display=swap');
                .ql-display { font-family: 'Instrument Serif', serif; }
                .ql-eyebrow { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.14em; }
                .ql-stroke {
                    stroke-dasharray: 340;
                    stroke-dashoffset: 340;
                    animation: ql-draw 1.4s 0.3s ease-out forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                    .ql-stroke { animation: none; stroke-dashoffset: 0; }
                }
                @keyframes ql-draw {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>

            {/* Left panel — editorial / brand side */}
            <div className="relative lg:w-[46%] lg:min-h-screen flex flex-col justify-between overflow-hidden px-6 sm:px-10 lg:px-14 py-8 sm:py-10 lg:py-14 bg-[linear-gradient(160deg,_#1B1830_0%,_#2E1F66_65%,_#3B2C7A_100%)]">
                {/* decorative oversized quote mark — hidden on small phones, too dominant there */}
                <span className="ql-display pointer-events-none select-none absolute -top-6 -left-2 text-[120px] sm:text-[180px] lg:text-[220px] leading-none text-white/[0.05] hidden sm:block">
                    &ldquo;
                </span>

                <Link
                    to="/"
                    className="relative z-10 w-fit text-white/70 hover:text-white text-sm transition-colors"
                >
                    ← Back to QuillSpace
                </Link>

                <div className="relative z-10">
                    <p className="ql-eyebrow text-[10px] sm:text-[11px] text-[#C9A227] mb-4 sm:mb-6">
                        WELCOME TO QUILLSPACE
                    </p>
                    <h1 className="ql-display text-2xl sm:text-4xl lg:text-5xl leading-[1.2] lg:leading-[1.15] text-white max-w-md">
                        Every great story starts with a single word.
                    </h1>

                    <svg
                        width="180"
                        height="24"
                        viewBox="0 0 180 24"
                        fill="none"
                        className="mt-4 sm:mt-6 max-w-[140px] sm:max-w-none"
                        aria-hidden="true"
                    >
                        <path
                            className="ql-stroke"
                            d="M2 18 C 40 4, 70 22, 100 10 S 150 2, 178 12"
                            stroke="#5044E5"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                <p className="relative z-10 text-white/50 text-sm max-w-xs hidden sm:block">
                    Join thousands of writers publishing, discussing, and discovering
                    ideas worth reading.
                </p>
            </div>

            {/* Right panel — auth form */}
            <div className="flex-1 flex items-center justify-center bg-[#FBF9F5] px-5 sm:px-10 py-10 sm:py-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h2 className="ql-display text-3xl text-[#241F2E]">
                            {isRegister ? "Create your account" : "Welcome back"}
                        </h2>
                        <p className="text-[#241F2E]/60 text-sm mt-2">
                            {isRegister
                                ? "Start writing on QuillSpace in under a minute."
                                : "Log in to keep reading and writing."}
                        </p>
                    </div>

                    <div className="mb-6">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error("Google sign-in failed.")}
                            theme="outline"
                            shape="pill"
                            size="large"
                            text={isRegister ? "signup_with" : "signin_with"}
                            logo_alignment="left"
                        />
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-[#241F2E]/10" />
                        <span className="ql-eyebrow text-[10px] text-[#241F2E]/40">OR</span>
                        <div className="flex-1 h-px bg-[#241F2E]/10" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isRegister && (
                            <div>
                                <label className="ql-eyebrow block text-[10px] text-[#241F2E]/60 mb-2">
                                    NAME
                                </label>
                                <input
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                    type="text"
                                    placeholder="Your full name"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-[#241F2E]/15 bg-white text-[#241F2E] placeholder:text-[#241F2E]/35 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                />
                            </div>
                        )}

                        <div>
                            <label className="ql-eyebrow block text-[10px] text-[#241F2E]/60 mb-2">
                                EMAIL
                            </label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email"
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-[#241F2E]/15 bg-white text-[#241F2E] placeholder:text-[#241F2E]/35 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="ql-eyebrow block text-[10px] text-[#241F2E]/60 mb-2">
                                PASSWORD
                            </label>
                            <div className="relative">
                                <input
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 pr-11 rounded-xl border border-[#241F2E]/15 bg-white text-[#241F2E] placeholder:text-[#241F2E]/35 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#241F2E]/40 hover:text-[#241F2E]/70 cursor-pointer"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <AiOutlineEyeInvisible size={19} /> : <AiOutlineEye size={19} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl font-medium text-white bg-primary shadow-[0_8px_20px_-6px_rgba(80,68,229,0.55)] transition-all cursor-pointer ${
                                loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf] hover:-translate-y-[1px]"
                            }`}
                        >
                            {loading
                                ? (isRegister ? "Creating account…" : "Logging in…")
                                : (isRegister ? "Create account" : "Log in")}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-[#241F2E]/60">
                        {isRegister ? "Already have an account?" : "New to QuillSpace?"}{" "}
                        <span
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-primary font-semibold cursor-pointer hover:underline"
                        >
                            {isRegister ? "Log in" : "Create one"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
