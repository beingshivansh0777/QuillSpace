import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import Moment from "moment";

const STATUS_STYLES = {
    open: "bg-yellow-50 text-yellow-700 border-yellow-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
};

const CATEGORY_LABELS = {
    bug: "Bug",
    feature_request: "Feature Request",
    account_issue: "Account Issue",
    other: "Other",
};

const TicketThread = () => {
    const { id } = useParams();
    const { axios, user, token, socket } = useAppContext();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [changingStatus, setChangingStatus] = useState(false);

    const isAdmin = user?.role === "admin";

    const fetchTicket = async () => {
        try {
            const { data } = await axios.get(`/api/tickets/${id}`);
            if (data.success) {
                setTicket(data.ticket);
            } else {
                setNotFound(true);
            }
        } catch (error) {
            setNotFound(true);
        }
    };

    useEffect(() => {
        if (token && user) fetchTicket();
    }, [token, user]);

    // Join this ticket's live room while the thread is open, leave when
    // navigating away — keeps the server from broadcasting every ticket's
    // traffic to everyone, only to people actually looking at this one.
    useEffect(() => {
        if (!socket || !id) return;
        socket.emit("ticket:join", id);
        return () => socket.emit("ticket:leave", id);
    }, [socket, id]);

    // Live message + status updates. The sender's OWN reply already lands
    // via the REST response in handleReply below (setTicket(data.ticket)),
    // so this listener skips re-appending a message whose _id we already have
    // — otherwise the sender would see their own message duplicated.
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (payload) => {
            if (payload.ticketId !== id) return;
            setTicket((prev) => {
                if (!prev) return prev;
                const alreadyHave = prev.messages.some((m) => m._id === payload.message._id);
                if (alreadyHave) return { ...prev, status: payload.status };
                return {
                    ...prev,
                    status: payload.status,
                    messages: [...prev.messages, payload.message],
                };
            });
        };

        const handleStatus = (payload) => {
            if (payload.ticketId !== id) return;
            setTicket((prev) => (prev ? { ...prev, status: payload.status } : prev));
        };

        socket.on("ticket:message", handleMessage);
        socket.on("ticket:status", handleStatus);
        return () => {
            socket.off("ticket:message", handleMessage);
            socket.off("ticket:status", handleStatus);
        };
    }, [socket, id]);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setSending(true);
        try {
            const { data } = await axios.post(`/api/tickets/${id}/reply`, { content: reply });
            if (data.success) {
                setTicket(data.ticket);
                setReply("");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setChangingStatus(true);
        try {
            const { data } = await axios.patch(`/api/tickets/${id}/status`, { status: newStatus });
            if (data.success) {
                setTicket(data.ticket);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setChangingStatus(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#FBF9F5]">
                <Navbar />
                <div className="max-w-md mx-auto mt-24 text-center px-5">
                    <p className="text-[#241F2E]/60">Please login to view this ticket.</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-[#FBF9F5]">
                <Navbar />
                <div className="max-w-md mx-auto mt-24 text-center px-5">
                    <h2 className="text-2xl font-semibold text-[#241F2E] mb-2">Ticket not found</h2>
                    <p className="text-[#241F2E]/55">
                        This ticket doesn't exist, or you don't have access to it.
                    </p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!ticket) return <Loader />;

    return (
        <div className="min-h-screen bg-[#FBF9F5]">
            <Navbar />

            <div className="max-w-2xl mx-auto px-5 py-12">
                <button
                    onClick={() => navigate(isAdmin ? "/admin/tickets" : "/support")}
                    className="text-sm text-[#241F2E]/50 hover:text-primary transition-colors mb-4 cursor-pointer"
                >
                    ← Back
                </button>

                <div className="bg-white rounded-2xl border border-[#241F2E]/8 p-6 mb-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                {CATEGORY_LABELS[ticket.category]}
                            </span>
                            {isAdmin && (
                                <p className="text-xs text-[#241F2E]/40 mt-2">
                                    {ticket.user?.name} · {ticket.user?.email}
                                </p>
                            )}
                        </div>

                        {isAdmin ? (
                            <select
                                value={ticket.status}
                                disabled={changingStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-full border outline-none cursor-pointer ${STATUS_STYLES[ticket.status]}`}
                            >
                                {Object.keys(STATUS_LABELS).map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                        ) : (
                            <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${STATUS_STYLES[ticket.status]}`}>
                                {STATUS_LABELS[ticket.status]}
                            </span>
                        )}
                    </div>

                    {ticket.screenshot && (
                        <img
                            src={ticket.screenshot}
                            alt="Screenshot"
                            className="rounded-lg max-h-64 object-cover border border-[#241F2E]/8 mb-2"
                        />
                    )}
                    <p className="text-xs text-[#241F2E]/40">
                        Submitted {Moment(ticket.createdAt).format("MMM D, YYYY [at] h:mm A")}
                    </p>
                </div>

                {/* Thread */}
                <div className="flex flex-col gap-3 mb-6">
                    {ticket.messages.map((msg, i) => (
                        <div
                            key={msg._id || i}
                            className={`max-w-[85%] p-4 rounded-2xl ${
                                msg.senderRole === "admin"
                                    ? "bg-primary/5 border border-primary/15 self-start"
                                    : "bg-white border border-[#241F2E]/8 ml-auto"
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold ${msg.senderRole === "admin" ? "text-primary" : "text-[#241F2E]"}`}>
                                    {msg.senderRole === "admin" ? "Support Team" : (msg.sender?.name || "You")}
                                </span>
                                <span className="text-xs text-[#241F2E]/35">
                                    {Moment(msg.createdAt).fromNow()}
                                </span>
                            </div>
                            <p className="text-sm text-[#241F2E]/75 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    ))}
                </div>

                {/* Reply box — a user reply auto-reopens a resolved/closed ticket (handled server-side) */}
                <form onSubmit={handleReply} className="flex flex-col gap-2">
                    <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write a reply…"
                        rows={3}
                        className="w-full p-3 rounded-xl border border-[#241F2E]/15 bg-white outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                    <button
                        type="submit"
                        disabled={sending}
                        className={`self-end px-6 py-2.5 rounded-full text-sm font-medium text-white bg-primary transition-all cursor-pointer ${
                            sending ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf]"
                        }`}
                    >
                        {sending ? "Sending…" : "Send reply"}
                    </button>
                </form>
            </div>

            <Footer />
        </div>
    );
};

export default TicketThread;
