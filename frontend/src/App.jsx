import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute    from "./components/ProtectedRoute";
import Navbar            from "./components/Navbar";

import Login       from "./pages/Login";
import Register    from "./pages/Register";
import Dashboard   from "./pages/Dashboard";
import AddContent  from "./pages/AddContent";
import ReviewQueue from "./pages/ReviewQueue";
import QuizPage    from "./pages/QuizPage";
import Progress    from "./pages/Progress";

const Layout = ({ children }) => (
  <div className="min-h-screen dark:bg-dark-bg">
    <Navbar />
    <main>{children}</main>
  </div>
)

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/add" element={
              <ProtectedRoute>
                <Layout><AddContent /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/review" element={
              <ProtectedRoute>
                <Layout><ReviewQueue /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/quiz/:id" element={
              <ProtectedRoute>
                <Layout><QuizPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/progress" element={
              <ProtectedRoute>
                <Layout><Progress /></Layout>
              </ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;