import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

const difficultyColor = (d) => ({
  easy:   "bg-green-500/10 text-green-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  hard:   "bg-red-500/10 text-red-400",
}[d] || "bg-gray-500/10 text-gray-400");

const ReviewQueue = () => {
  const [concepts,  setConcepts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState(null); // track which concept is being deleted
  const [confirmId, setConfirmId] = useState(null); // track which concept shows confirm dialog
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDue = async () => {
      try {
        const res = await api.get("/review/due");
        setConcepts(res.data.data.concepts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDue();
  }, []);

  const handleDelete = async (conceptId) => {
    setDeleting(conceptId);
    try {
      await api.delete(`/review/${conceptId}`);
      // Remove from local state immediately
      setConcepts((prev) => prev.filter((c) => c._id !== conceptId));
      setConfirmId(null);
    } catch (err) {
      console.error("Delete failed:", err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading review queue..." />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Review Queue</h1>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
          {concepts.length} due today
        </span>
      </div>

      {concepts.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-xl font-bold text-light-text dark:text-dark-text">
            All caught up!
          </p>
          <p className="text-gray-400 mt-2 mb-6">
            No concepts due today. Add more content to keep learning.
          </p>
          <button onClick={() => navigate("/add")} className="btn-primary">
            Add Content →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {concepts.map((concept) => (
            <div key={concept._id} className="card hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${difficultyColor(concept.difficulty)}`}>
                      {concept.difficulty}
                    </span>
                    <span className="text-xs text-gray-400">
                      {concept.video?.title || "Unknown source"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-light-text dark:text-dark-text mb-1">
                    {concept.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {concept.explanation}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>📝 {concept.questions?.length || 0} questions</span>
                    <span>🔄 Review #{(concept.schedule?.repetitions || 0) + 1}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/quiz/${concept._id}`)}
                    className="btn-primary whitespace-nowrap text-sm"
                  >
                    Start →
                  </button>

                  {/* Delete button */}
                  {confirmId === concept._id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(concept._id)}
                        disabled={deleting === concept._id}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        {deleting === concept._id ? "..." : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex-1 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(concept._id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    >
                      🗑 Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Confirm message */}
              {confirmId === concept._id && (
                <div className="mt-3 pt-3 border-t border-light-border dark:border-dark-border">
                  <p className="text-xs text-red-400">
                    ⚠️ This will permanently delete this concept and all its questions. Are you sure?
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;