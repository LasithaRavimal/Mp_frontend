import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import AdminSidebar from '../admin/music/AdminSidebar';

const ResearchDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResearchData();
  }, []);

  const fetchResearchData = async () => {
    try {
      const response = await apiClient.get('/admin/research-data');
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch research data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (level) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'bg-red-500/20 text-red-400 border border-red-500/30';
    if (l === 'moderate') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    return 'bg-spotify-green/20 text-spotify-green border border-spotify-green/30';
  };

  return (
    <div className="flex h-screen bg-spotify-black overflow-hidden">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden bg-spotify-dark-gray">
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Research Data Dashboard</h1>
            <p className="text-text-gray mt-2">Combined user listening behavior and stress/depression indicators.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-spotify-black rounded-xl border border-spotify-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-spotify-light-gray text-white border-b border-spotify-gray text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold w-1/6">User Email</th>
                      <th className="px-6 py-4 font-semibold w-1/6">Date</th>
                      <th className="px-6 py-4 font-semibold w-1/6">Top Category</th>
                      {/* SINGLE COMBINED BEHAVIOR COLUMN */}
                      <th className="px-6 py-4 font-semibold text-spotify-green w-2/6">Listening Behavior Profile</th>
                      <th className="px-6 py-4 font-semibold text-center w-1/12">Pred. Depression</th>
                      <th className="px-6 py-4 font-semibold text-center w-1/12">Pred. Stress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-spotify-gray/50">
                    {data.map((row) => (
                      <tr key={row.session_id} className="hover:bg-spotify-light-gray/30 transition-colors align-top">
                        
                        {/* 1. EMAIL */}
                        <td className="px-6 py-5 font-medium text-white">{row.email}</td>
                        
                        {/* 2. DATE */}
                        <td className="px-6 py-5 text-sm text-text-gray">
                          {new Date(row.date).toLocaleDateString()} <br/>
                          <span className="text-xs opacity-70">{new Date(row.date).toLocaleTimeString()}</span>
                        </td>
                        
                        {/* 3. CATEGORY */}
                        <td className="px-6 py-5 text-sm text-white capitalize font-semibold">
                          {row.behavior?.song_category_mode || "N/A"}
                        </td>
                        
                        {/* 4. COMBINED BEHAVIOR LIST */}
                        <td className="px-6 py-5">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            <div className="flex flex-col">
                              <span className="text-text-gray opacity-70">Time of Day</span>
                              <span className="text-white">{row.behavior?.listening_time_of_day || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-text-gray opacity-70">Session Length</span>
                              <span className="text-white">{row.behavior?.session_length_bucket || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-text-gray opacity-70">Volume</span>
                              <span className="text-white">{row.behavior?.volume_level_bucket || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-text-gray opacity-70">Skips</span>
                              <span className="text-white">{row.behavior?.skip_rate_bucket || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-text-gray opacity-70">Repeats</span>
                              <span className="text-white">{row.behavior?.repeat_bucket || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-text-gray opacity-70">Diversity</span>
                              <span className="text-white">{row.behavior?.song_diversity_bucket || "N/A"}</span>
                            </div>
                          </div>
                        </td>

                        {/* 5. PREDICTION - DEPRESSION */}
                        <td className="px-6 py-5 text-center align-middle">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(row.prediction?.depression_level)}`}>
                            {row.prediction?.depression_level || "Unknown"}
                          </span>
                        </td>

                        {/* 6. PREDICTION - STRESS */}
                        <td className="px-6 py-5 text-center align-middle">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(row.prediction?.stress_level)}`}>
                            {row.prediction?.stress_level || "Unknown"}
                          </span>
                        </td>
                        
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-text-gray">
                          No research data collected yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchDashboard;