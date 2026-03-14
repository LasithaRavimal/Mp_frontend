import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

/* =========================
   USER
========================= */

import LoginPage from "./components/user/LoginPage";
import LandingPage from "./components/user/LandingPage";
import MusicProfile from "./components/user/MusicProfile";
import MusicProfileSettings from "./components/user/MusicProfileSettings";
import Questionnaire from "./components/music/Questionnaire";

/* =========================
   MUSIC
========================= */

import MusicWrapper from "./components/music/MusicWrapper";
import MusicPlayerHome from "./components/music/MusicPlayerHome";
import SearchPage from "./components/music/SearchPage";
import LibraryPage from "./components/music/LibraryPage";
import CategoryPage from "./components/music/CategoryPage";
import PlaylistPage from "./components/music/playlist/PlaylistPage";

/* =========================
   ADMIN
========================= */

import SongManagement from "./components/admin/music/SongManagement";

/* =========================
   LOADER
========================= */

const FullScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    Loading...
  </div>
);

/* =========================
   ROUTE GUARDS
========================= */

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (user) {
    return user.role === "admin"
      ? <Navigate to="/admin" replace />
      : <Navigate to="/landing" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return user.role === "admin"
    ? <Navigate to="/admin" replace />
    : <Navigate to="/landing" replace />;
};

/* =========================
   ROUTES
========================= */

function AppRoutes() {
  return (
    <Routes>

      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Landing */}
      <Route
        path="/landing"
        element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        }
      />
       {/* Questionnaire */}
      <Route
        path="/questionnaire"
        element={
          <ProtectedRoute>
            <Questionnaire />
          </ProtectedRoute>
        }
      />

      {/* ================= MUSIC ================= */}

      <Route
        path="/musichome"
        element={
          <ProtectedRoute>
            <MusicWrapper>
              <MusicPlayerHome />
            </MusicWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <MusicWrapper>
              <SearchPage />
            </MusicWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <MusicWrapper>
              <LibraryPage />
            </MusicWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/category/:categoryName"
        element={
          <ProtectedRoute>
            <MusicWrapper>
              <CategoryPage />
            </MusicWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/playlist/:id"
        element={
          <ProtectedRoute>
            <MusicWrapper>
              <PlaylistPage />
            </MusicWrapper>
          </ProtectedRoute>
        }
      />

      {/* ================= PROFILE ================= */}

      <Route
        path="/music-profile"
        element={
          <ProtectedRoute>
            <MusicWrapper>
              <MusicProfile />
            </MusicWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/music-profile-settings"
        element={
          <ProtectedRoute>
            <MusicWrapper>
              <MusicProfileSettings />
            </MusicWrapper>
          </ProtectedRoute>
        }
      />

      {/* ================= ADMIN ================= */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <SongManagement />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

/* =========================
   APP ROOT
========================= */

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}