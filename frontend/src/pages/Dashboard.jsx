import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const StatCard = ({ icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`text-3xl w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-light-text dark:text-dark-text">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user }                = useAuth();
  const [stats,   setStats]     = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/review/stats");
        setStats(res.data.data.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">
          Hey {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1">
          {stats?.dueToday > 0
            ? `You have ${stats.dueToday} concept${stats.dueToday > 1 ? "s" : ""} due for review today.`
            : "You're all caught up today! Add more content to keep learning."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🔥" label="Day Streak"       value={stats?.streak || 0}           color="bg-orange-500/10" />
        <StatCard icon="📚" label="Total Concepts"   value={stats?.totalConcepts || 0}     color="bg-blue-500/10" />
        <StatCard icon="✅" label="Retained"         value={stats?.retainedCount || 0}     color="bg-green-500/10" />
        <StatCard icon="⏰" label="Due Today"        value={stats?.dueToday || 0}          color="bg-red-500/10" />
      </div>

      {/* Retention Rate */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-light-text dark:text-dark-text">
            Overall Retention Rate
          </h2>
          <span className="text-primary font-bold text-xl">
            {stats?.retentionRate || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats?.retentionRate || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{stats?.retainedCount || 0} retained</span>
          <span>{stats?.inProgressCount || 0} in progress</span>
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div className="card mb-8">
        <h2 className="font-semibold text-light-text dark:text-dark-text mb-4">
          Concepts by Difficulty
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Easy",   value: stats?.byDifficulty?.easy   || 0, color: "text-green-400" },
            { label: "Medium", value: stats?.byDifficulty?.medium || 0, color: "text-yellow-400" },
            { label: "Hard",   value: stats?.byDifficulty?.hard   || 0, color: "text-red-400" },
          ].map((d) => (
            <div key={d.label} className="text-center p-4 bg-light-bg dark:bg-dark-bg rounded-xl">
              <p className={`text-2xl font-bold ${d.color}`}>{d.value}</p>
              <p className="text-sm text-gray-400 mt-1">{d.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/add" className="card hover:border-primary transition-colors text-center group">
          <div className="text-3xl mb-2">➕</div>
          <p className="font-semibold text-light-text dark:text-dark-text group-hover:text-primary transition-colors">
            Add Content
          </p>
          <p className="text-xs text-gray-400 mt-1">YouTube, Text, or PDF</p>
        </Link>

        <Link to="/review" className="card hover:border-primary transition-colors text-center group">
          <div className="text-3xl mb-2">📝</div>
          <p className="font-semibold text-light-text dark:text-dark-text group-hover:text-primary transition-colors">
            Start Review
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.dueToday || 0} due today
          </p>
        </Link>

        <Link to="/progress" className="card hover:border-primary transition-colors text-center group">
          <div className="text-3xl mb-2">📊</div>
          <p className="font-semibold text-light-text dark:text-dark-text group-hover:text-primary transition-colors">
            View Progress
          </p>
          <p className="text-xs text-gray-400 mt-1">All concepts + schedule</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;