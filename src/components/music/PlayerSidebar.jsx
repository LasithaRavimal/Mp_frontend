import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdHome,
  MdSearch,
  MdLibraryMusic,
  MdAnalytics,
  MdExpandMore,
  MdExpandLess
} from 'react-icons/md';

const Sidebar = () => {

  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const isActive = (path) => location.pathname === path;

  const userMenuItems = [
    { path: '/landing', icon: MdHome, label: 'Back to Home' },
    { path: '/musichome', icon: MdHome, label: 'MusicPlayerHome' },
    { path: '/weekly-analysis', icon: MdAnalytics, label: 'Weekly Analysis' },
    { path: '/search', icon: MdSearch, label: 'Search' },
    { path: '/library', icon: MdLibraryMusic, label: 'Your Library' }
  ];

  const categories = ["Calm", "Happy", "Sad"];

  const handleCategoryClick = (category) => {
    navigate(`/category/${encodeURIComponent(category)}`);
  };

  return (

    <div className="w-64 bg-spotify-black border-r border-spotify-light-gray h-screen flex flex-col pb-[90px]">

      {/* Logo */}
      <div className="p-6 border-b border-spotify-light-gray">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-spotify-green">M</span>_Track
        </h1>
        <p className="text-xs text-text-gray mt-1">Music Behavior Analysis</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">

        <ul className="space-y-2">

          {userMenuItems.map((item) => (

            <li key={item.path}>

              <Link
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-spotify-light-gray text-white font-bold'
                    : 'text-text-gray hover:text-white hover:bg-spotify-dark-gray'
                }`}
              >

                <item.icon className="text-2xl" />
                <span>{item.label}</span>

              </Link>

            </li>

          ))}

        </ul>

        {/* Categories Section */}

        <div className="mt-8">

          <div className="flex items-center justify-between px-4 mb-3">

            <h3 className="text-xs font-bold text-text-gray uppercase tracking-wider">
              Categories
            </h3>

            <button
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="text-text-gray hover:text-white transition-colors"
            >

              {categoriesExpanded ? (
                <MdExpandLess />
              ) : (
                <MdExpandMore />
              )}

            </button>

          </div>

          {categoriesExpanded && (

            <div className="space-y-1">

              {categories.map((cat) => (

                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === `/category/${encodeURIComponent(cat)}`
                      ? 'bg-spotify-light-gray text-white font-bold'
                      : 'text-text-gray hover:text-white hover:bg-spotify-dark-gray'
                  }`}
                >

                  {cat}

                </button>

              ))}

            </div>

          )}

        </div>

      </nav>

    </div>

  );

};

export default Sidebar;