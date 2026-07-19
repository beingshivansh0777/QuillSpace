import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const ForgotPassword = () => {
    const { axios } = useAppContext();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post("/api/auth/forgot-password", { email });
            if (data.success) {
                setSent(true);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5] px-5">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
                .ql-fp-display { font-family: 'Instrument Serif', serif; }
            `}</style>

            <div className="w-full max-w-sm">
                {sent ? (
                    <div className="text-center">
                        <h1 className="ql-fp-display text-3xl text-[#241F2E] mb-3">Check your email</h1>
                        <p className="text-[#241F2E]/60 text-sm mb-6">
                            If an account exists for <span className="font-medium">{email}</span>, we've sent
                            a link to reset your password. It expires in 30 minutes.
                        </p>
                        <Link to="/login" className="text-primary font-semibold hover:underline text-sm">
                            ← Back to login
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="ql-fp-display text-3xl text-[#241F2E] mb-2">Forgot your password?</h1>
                        <p className="text-[#241F2E]/60 text-sm mb-8">
                            Enter your email and we'll send you a link to reset it.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-[#241F2E]/15 bg-white outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 rounded-xl font-medium text-white bg-primary transition-all cursor-pointer ${
                                    loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf]"
                                }`}
                            >
                                {loading ? "Sending…" : "Send reset link"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-[#241F2E]/60">
                            <Link to="/login" className="text-primary font-semibold hover:underline">
                                ← Back to login
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
