import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import Moment from "moment";

const Reports = () => {
  const { axios } = useAppContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const { data } = await axios.get("/api/reports");
      data.success ? setReports(data.reports) : toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDismiss = async (id) => {
    try {
      const { data } = await axios.patch(`/api/reports/dismiss/${id}`);
      if (data.success) {
        toast.success(data.message);
        setReports((prev) => prev.filter((r) => r._id !== id));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteContent = async (id) => {
    if (!window.confirm("Delete the reported content? This can't be undone.")) return;
    try {
      const { data } = await axios.post(`/api/reports/delete-content/${id}`);
      if (data.success) {
        toast.success(data.message);
        setReports((prev) => prev.filter((r) => r._id !== id));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex-1 pt-5 px-5 sm:pt-12 sm:pl-16 bg-blue-50/50">
      <div className="flex justify-between items-center max-w-3xl">
        <h1>Reports</h1>
        <p className="text-xs text-gray-500">{reports.length} pending</p>
      </div>

      <div className="relative max-w-3xl mt-4 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : reports.length === 0 ? (
          <div className="bg-white shadow rounded-lg py-10 text-center text-gray-400 text-sm">
            No pending reports.
          </div>
        ) : (
          reports.map((report) => (
            <div key={report._id} className="bg-white shadow rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                  {report.targetType}
                </span>
                <span className="text-xs text-gray-400">
                  {Moment(report.createdAt).fromNow()}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Reported by:</span> {report.reporter?.name} ({report.reporter?.email})
              </p>

              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Reason:</span> {report.reason}
              </p>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-4">
                {report.targetType === "blog" ? (
                  report.target ? (
                    <>Post: <span className="font-medium">{report.target.title}</span></>
                  ) : (
                    <span className="italic text-gray-400">Post no longer exists.</span>
                  )
                ) : report.target ? (
                  <>Comment: "{report.target.content}"</>
                ) : (
                  <span className="italic text-gray-400">Comment no longer exists.</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDismiss(report._id)}
                  className="text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-full px-4 py-1.5 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleDeleteContent(report._id)}
                  disabled={!report.target}
                  className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-4 py-1.5 transition-colors cursor-pointer"
                >
                  Delete content
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
