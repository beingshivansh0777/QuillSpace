import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CreateTicketModal from "../components/createTicketModel.jsx";
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

const SupportPage = () => {
  const { axios, token } = useAppContext();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTickets = async () => {
    try {
      const { data } = await axios.get("/api/tickets/mine");
      if (data.success) setTickets(data.tickets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTickets();
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FBF9F5]">
        <Navbar />
        <div className="max-w-md mx-auto mt-24 text-center px-5">
          <p className="text-[#241F2E]/60">
            Please <Link to="/login" className="text-primary font-semibold hover:underline">login</Link> to access support.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#241F2E]">Support</h1>
            <p className="text-sm text-[#241F2E]/55 mt-1">Need help? We're here for you.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-primary hover:bg-[#453adf] transition-all cursor-pointer"
          >
            New ticket
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-[#241F2E]/40">Loading…</p>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#241F2E]/8">
            <p className="text-[#241F2E]/60">No tickets yet.</p>
            <p className="text-[#241F2E]/40 text-sm mt-1">
              If something's not working right, let us know.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => navigate(`/support/${t._id}`)}
                className="bg-white rounded-xl border border-[#241F2E]/8 p-4 cursor-pointer hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {CATEGORY_LABELS[t.category]}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </div>
                <p className="text-sm text-[#241F2E]/75 line-clamp-2">{t.description}</p>
                <p className="text-xs text-[#241F2E]/35 mt-2">
                  {Moment(t.updatedAt).fromNow()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={() => fetchTickets()}
        />
      )}
    </div>
  );
};

export default SupportPage;
