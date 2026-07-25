import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const DeleteAccountModal = ({ hasPassword, onClose }) => {
    const { axios, logout } = useAppContext();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);

    const canSubmit = hasPassword ? password.length > 0 : confirmText === "DELETE";

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setDeleting(true);
        try {
            const { data } = await axios.delete("/api/auth/delete-account", {
                data: hasPassword ? { password } : {},
            });
            if (data.success) {
                toast.success(data.message);
                logout();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-100 px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-red-600 mb-1">Delete your account?</h2>
                <p className="text-sm text-gray-500 mb-5">
                    This permanently deletes your profile, blog posts, and comments. There's no undo.
                </p>

                <form onSubmit={handleDelete} className="space-y-4">
                    {hasPassword ? (
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Enter your password to confirm
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Type <span className="font-mono font-bold">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-all"
                            />
                        </div>
                    )}

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
                            disabled={!canSubmit || deleting}
                            className={`flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium transition-all cursor-pointer ${
                                !canSubmit || deleting ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600"
                            }`}
                        >
                            {deleting ? "Deleting…" : "Delete account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
