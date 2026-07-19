import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ResetPassword = () => {
    const { token } = useParams();
    const { axios } = useAppContext();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`/api/auth/reset-password/${token}`, { newPassword });
            if (data.success) {
                toast.success(data.message);
                navigate("/login");
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
                .ql-rp-display { font-family: 'Instrument Serif', serif; }
            `}</style>

            <div className="w-full max-w-sm">
                <h1 className="ql-rp-display text-3xl text-[#241F2E] mb-2">Set a new password</h1>
                <p className="text-[#241F2E]/60 text-sm mb-8">
                    Choose a new password for your account.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type={show ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full px-4 py-3 pr-11 rounded-xl border border-[#241F2E]/15 bg-white outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShow((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#241F2E]/40 hover:text-[#241F2E]/70 cursor-pointer"
                        >
                            {show ? <AiOutlineEyeInvisible size={19} /> : <AiOutlineEye size={19} />}
                        </button>
                    </div>

                    <input
                        type={show ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 rounded-xl border border-[#241F2E]/15 bg-white outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 rounded-xl font-medium text-white bg-primary transition-all cursor-pointer ${
                            loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf]"
                        }`}
                    >
                        {loading ? "Resetting…" : "Reset password"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#241F2E]/60">
                    <Link to="/login" className="text-primary font-semibold hover:underline">
                        ← Back to login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
