import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
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

const Tickets = () => {
  const { axios, socket } = useAppContext();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const { data } = await axios.get("/api/tickets/admin/all");
      data.success ? setTickets(data.tickets) : toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Live-prepend brand-new tickets the instant someone submits one — admin
  // sockets auto-join a shared "admins" room server-side, so this fires for
  // every connected admin without needing per-ticket subscriptions.
  useEffect(() => {
    if (!socket) return;
    const handleNewTicket = (ticket) => {
      setTickets((prev) => {
        if (prev.some((t) => t._id === ticket._id)) return prev; // avoid dupes on refetch races
        return [ticket, ...prev];
      });
    };
    socket.on("admin:newTicket", handleNewTicket);
    return () => socket.off("admin:newTicket", handleNewTicket);
  }, [socket]);

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="flex-1 pt-5 px-5 sm:pt-12 sm:pl-16 bg-blue-50/50">
      <div className="flex justify-between items-center max-w-4xl flex-wrap gap-3">
        <h1>Support Tickets</h1>
        <div className="flex gap-2 flex-wrap">
          {["all", "open", "in_progress", "resolved", "closed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                filter === f
                  ? "bg-primary text-white border-primary"
                  : "border-gray-300 text-gray-600 hover:border-primary/40"
              }`}
            >
              {f === "all" ? "All" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mt-4 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white shadow rounded-lg py-10 text-center text-gray-400 text-sm">
            No tickets here.
          </div>
        ) : (
          filtered.map((t) => (
            <div
              key={t._id}
              onClick={() => navigate(`/admin/tickets/${t._id}`)}
              className="bg-white shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {CATEGORY_LABELS[t.category]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {t.user?.name} ({t.user?.email})
                  </span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[t.status]}`}>
                  {STATUS_LABELS[t.status]}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
              <p className="text-xs text-gray-400 mt-2">{Moment(t.updatedAt).fromNow()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tickets;
