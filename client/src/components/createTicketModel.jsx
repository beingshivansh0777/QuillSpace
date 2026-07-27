import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const CATEGORIES = [
    { value: "bug", label: "Bug" },
    { value: "feature_request", label: "Feature Request" },
    { value: "account_issue", label: "Account Issue" },
    { value: "other", label: "Other" },
];

const CreateTicketModal = ({ onClose, onCreated }) => {
    const { axios } = useAppContext();
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [screenshot, setScreenshot] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) {
            toast.error("Please select a category.");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("category", category);
            formData.append("description", description);
            if (screenshot) formData.append("screenshot", screenshot);

            const { data } = await axios.post("/api/tickets", formData);
            if (data.success) {
                toast.success(data.message);
                onCreated?.(data.ticket);
                onClose();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-100 px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Create a support ticket</h2>
                <p className="text-sm text-gray-500 mb-5">
                    Tell us what's going on — we'll get back to you.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setCategory(c.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                        category === c.value
                                            ? "bg-primary text-white border-primary"
                                            : "border-gray-300 text-gray-600 hover:border-primary/40"
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue in detail…"
                            rows={5}
                            required
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Screenshot <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setScreenshot(e.target.files[0])}
                            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
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
                            disabled={submitting}
                            className={`flex-1 py-2.5 rounded-lg bg-primary text-white font-medium transition-all cursor-pointer ${
                                submitting ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/90"
                            }`}
                        >
                            {submitting ? "Submitting…" : "Submit ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicketModal;
