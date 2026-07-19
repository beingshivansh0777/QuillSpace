import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { HiOutlineCamera } from "react-icons/hi";

const EditProfileModal = ({ onClose }) => {
    const { axios, user, setUser } = useAppContext();

    const [username, setUsername] = useState(user?.username || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [avatarFile, setAvatarFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const initial = user?.name?.charAt(0).toUpperCase() || "?";

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("username", username);
            formData.append("bio", bio);
            if (avatarFile) formData.append("avatar", avatarFile);

            const { data } = await axios.patch("/api/auth/update-profile", formData);
            if (data.success) {
                setUser(data.user);
                toast.success("Profile updated.");
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
                <h2 className="text-xl font-semibold text-gray-800 mb-1">Edit profile</h2>
                <p className="text-sm text-gray-500 mb-6">
                    This is how you'll appear across QuillSpace.
                </p>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="flex justify-center">
                        <label htmlFor="avatar" className="cursor-pointer relative block w-20 h-20">
                            {avatarFile ? (
                                <img
                                    src={URL.createObjectURL(avatarFile)}
                                    alt=""
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt=""
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-semibold">
                                    {initial}
                                </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-white">
                                <HiOutlineCamera size={15} />
                            </span>
                            <input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => setAvatarFile(e.target.files[0])}
                            />
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Username
                        </label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                            placeholder="e.g. shivansh_writes"
                            maxLength={30}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                        <p className="text-xs text-gray-400 mt-1">Letters, numbers, and underscores only.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell people a little about yourself…"
                            maxLength={160}
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/160</p>
                    </div>

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
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
