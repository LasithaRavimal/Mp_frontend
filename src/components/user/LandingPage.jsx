import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MdPerson, MdSettings, MdLogout } from "react-icons/md";
import heroBg from "../../immges/hero-bg.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showProfileMenu, useState] = useState(false);
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
    <div 
      className="relative flex flex-col items-center justify-center min-h-screen text-center bg-spotify-black bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-0"></div>

      {/* =========================
         PROFILE BUTTON
      ========================= */}
      {user && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-2 py-2 md:px-3 rounded-full border border-spotify-gray bg-spotify-dark-gray/80 backdrop-blur-md hover:bg-spotify-light-gray transition shadow-lg"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-spotify-green flex items-center justify-center text-white font-semibold shadow-inner text-sm md:text-base">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
          </button>

          {showProfileMenu && (
            <div className="mt-2 w-48 bg-spotify-light-gray/95 backdrop-blur-lg border border-spotify-gray rounded-lg shadow-2xl py-2 absolute right-0 overflow-hidden transform origin-top-right transition-all">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/music-profile");
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-spotify-dark-gray transition-colors text-sm md:text-base"
              >
                <MdPerson className="text-lg md:text-xl text-spotify-green" />
                <span className="font-medium">Profile</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/music-profile-settings");
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-spotify-dark-gray transition-colors text-sm md:text-base"
              >
                <MdSettings className="text-lg md:text-xl text-spotify-green" />
                <span className="font-medium">Settings</span>
              </button>

              <div className="border-t border-spotify-gray my-1"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-spotify-dark-gray hover:text-red-300 transition-colors text-sm md:text-base"
              >
                <MdLogout className="text-lg md:text-xl" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================
         MAIN CONTENT
      ========================= */}
      <div className="relative z-10 flex flex-col items-center space-y-6 md:space-y-8 px-6 w-full max-w-4xl">
        
        <div className="space-y-4 md:space-y-6">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-white tracking-tight drop-shadow-2xl">
            M_<span className="text-spotify-green">Track</span>
          </h1>
          <p className="text-base sm:text-lg md:text-2xl text-gray-200 font-medium max-w-2xl mx-auto drop-shadow-lg leading-relaxed px-2 md:px-0">
            Tune into your mind. Discover how your listening habits shape your mood and well-being.
          </p>
        </div>

        {/* SINGLE BUTTON FOR ASSESSMENT */}
        <div className="pt-4 md:pt-6 w-full sm:w-auto">
          <button
            onClick={() => navigate("/questionnaire")}
            className="w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 bg-spotify-green hover:bg-spotify-green-hover text-white rounded-full font-bold text-lg md:text-xl shadow-[0_0_20px_rgba(29,185,84,0.3)] hover:shadow-[0_0_30px_rgba(29,185,84,0.5)] transition-all transform hover:scale-105 active:scale-95"
          >
            Start Assessment
          </button>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;