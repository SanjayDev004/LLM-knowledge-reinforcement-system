import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

const difficultyColor = (d) => ({
  easy:   "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  hard:   "bg-red-500/10 text-red-400 border-red-500/20",
}[d] || "");

const Progress = () => {
  const [concepts, setConcepts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get("/review/progress");
        setConcepts(res.data.data.concepts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const filtered = concepts.filter((c) => {
    if (filter === "retained")   return c.isRetained;
    if (filter === "inprogress") return !c.isRetained;
    return true;
  });

  if (loading) return <LoadingSpinner text="Loading progress..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Progress</h1>
        <span className="text-sm text-gray-400">{concepts.length} total concepts</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all",        label: "All" },
          { key: "inprogress", label: "In Progress" },
          { key: "retained",   label: "Retained ✅" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-primary text-dark-bg"
                : "text-gray-400 hover:text-primary border border-light-border dark:border-dark-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Concepts list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No concepts found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((concept) => (
            <div key={concept._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${difficultyColor(concept.difficulty)}`}>
                      {concept.difficulty}
                    </span>
                    {concept.isRetained && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                        ✅ Retained
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{concept.video}</span>
                  </div>
                  <h3 className="font-semibold text-light-text dark:text-dark-text">
                    {concept.title}
                  </h3>
                </div>

                {/* Schedule info */}
                <div className="text-right text-xs text-gray-400 shrink-0">
                  <p>Reviewed {concept.schedule.repetitions}×</p>
                  <p className="mt-1">
                    {concept.isRetained
                      ? "🏆 Long-term memory"
                      : `Next in ${concept.schedule.interval} day${concept.schedule.interval > 1 ? "s" : ""}`}
                  </p>
                  <p className="mt-1">
                    EF: {concept.schedule.easeFactor}
                  </p>
                </div>
              </div>

              {/* Progress bar — based on repetitions (5 = retained) */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((concept.schedule.repetitions / 5) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {concept.schedule.repetitions}/5 repetitions to retain
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Progress;