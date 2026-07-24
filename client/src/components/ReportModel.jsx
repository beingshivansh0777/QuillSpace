import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const ReportModal = ({ targetType, targetId, onClose }) => {
    const { axios } = useAppContext();
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error("Please describe the issue.");
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post("/api/reports", {
                targetType,
                targetId,
                reason,
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
            setSubmitting(false);
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
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Report {targetType === "blog" ? "this post" : "this comment"}
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                    Let us know what's wrong — an admin will review it.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="What's the issue?"
                        maxLength={300}
                        rows={4}
                        required
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                    />

                    <div className="flex gap-3">
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
                            className={`flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium transition-all cursor-pointer ${
                                submitting ? "opacity-60 cursor-not-allowed" : "hover:bg-red-600"
                            }`}
                        >
                            {submitting ? "Reporting…" : "Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
