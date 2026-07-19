import React, { useState } from "react";
import { useAppContext } from "../context/AppContext.jsx";
import toast from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const PasswordField = ({ label, value, onChange, show, toggleShow, placeholder }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            <button
                type="button"
                onClick={toggleShow}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
            </button>
        </div>
    </div>
);

const ResetPasswordModal = ({ onClose }) => {
    const { axios, user } = useAppContext();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);

    const hasPassword = user?.hasPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match.");
            return;
        }

        setSaving(true);
        try {
            const { data } = await axios.patch("/api/auth/change-password", {
                currentPassword: hasPassword ? currentPassword : undefined,
                newPassword,
            });
            if (data.success) {
                toast.success(data.message);
                onClose();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-semibold text-gray-800 mb-1">
                    {hasPassword ? "Reset password" : "Set a password"}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    {hasPassword
                        ? "Enter your current password, then choose a new one."
                        : "Your account currently uses Google Sign-In. Set a password to also log in with email."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {hasPassword && (
                        <PasswordField
                            label="CURRENT PASSWORD"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            show={showCurrent}
                            toggleShow={() => setShowCurrent((v) => !v)}
                            placeholder="Your current password"
                        />
                    )}

                    <PasswordField
                        label="NEW PASSWORD"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        show={showNew}
                        toggleShow={() => setShowNew((v) => !v)}
                        placeholder="At least 6 characters"
                    />

                    <PasswordField
                        label="CONFIRM PASSWORD"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        show={showConfirm}
                        toggleShow={() => setShowConfirm((v) => !v)}
                        placeholder="Re-enter new password"
                    />

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex-1 py-2.5 rounded-lg bg-primary text-white font-medium transition-all cursor-pointer ${
                                saving ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/90"
                            }`}
                        >
                            {saving ? "Saving…" : hasPassword ? "Update password" : "Set password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordModal;
