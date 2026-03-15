import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MdPerson, MdSettings, MdLogout } from "react-icons/md";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  /* =========================
     CLOSE DROPDOWN OUTSIDE CLICK
  ========================= */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate("/login");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-spotify-dark-gray to-spotify-black text-center">

      {/* =========================
         PROFILE BUTTON
      ========================= */}

      {user && (
        <div className="absolute top-6 right-6" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-spotify-gray bg-spotify-dark-gray hover:bg-spotify-light-gray transition"
          >
            <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center text-white font-semibold">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
          </button>

          {/* PROFILE DROPDOWN */}

          {showProfileMenu && (
            <div className="mt-2 w-44 bg-spotify-light-gray border border-spotify-gray rounded-lg shadow-xl py-2">

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/music-profile");
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-white hover:bg-spotify-dark-gray"
              >
                <MdPerson />
                Profile
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/music-profile-settings");
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-white hover:bg-spotify-dark-gray"
              >
                <MdSettings />
                Settings
              </button>

              <div className="border-t border-spotify-gray my-1"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-white hover:bg-spotify-dark-gray"
              >
                <MdLogout />
                Logout
              </button>

            </div>
          )}
        </div>
      )}

      {/* =========================
         MAIN CONTENT
      ========================= */}

      <div className="flex flex-col items-center space-y-8">

        <h1 className="text-6xl md:text-7xl font-bold text-white">
          M_<span className="text-spotify-green">Track</span>
        </h1>

        <button
          onClick={() => navigate("/questionnaire")}
          className="px-8 py-3 bg-spotify-green hover:bg-spotify-green-hover text-white rounded-lg font-semibold transition"
        >
          Start Assessment
        </button>

      </div>

    </div>
  );
};

export default LandingPage;