import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth }  from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout }        = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm transition-colors ${
        location.pathname === to
          ? "text-primary font-semibold"
          : "text-gray-500 dark:text-gray-400 hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border sticky top-0 z-50">
      {/* Center container — same max width as pages */}
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🧠</span>
          <span className="text-primary font-bold text-lg hidden sm:block">
            Cognitive
          </span>
        </Link>

        {/* Nav Links — center */}
        <div className="hidden md:flex items-center gap-6">
          {navLink("/dashboard", "Dashboard")}
          {navLink("/add",       "Add Content")}
          {navLink("/review",    "Review")}
          {navLink("/progress",  "Progress")}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg border border-light-border dark:border-dark-border flex items-center justify-center hover:border-primary transition-colors text-base"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {user && (
            <div className="flex items-center gap-3">
              {/* User info */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-light-text dark:text-dark-text leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400">🔥 {user.streak || 0} day streak</p>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-500 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <span>↩</span>
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
