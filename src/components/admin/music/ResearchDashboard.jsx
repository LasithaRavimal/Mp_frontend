import { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import AdminSidebar from './AdminSidebar';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const downloadPDF = () => {
    const doc = new jsPDF("landscape");

    doc.setFontSize(16);
    doc.text("Research Dataset Report", 14, 15);

    const tableData = data.map((row) => [
      row.email || "N/A",
      new Date(row.date).toLocaleDateString(),

      row.behavior?.song_category_mode || "N/A",
      row.behavior?.listening_time_of_day || "N/A",
      row.behavior?.session_length_bucket || "N/A",
      row.behavior?.volume_level_bucket || "N/A",
      row.behavior?.skip_rate_bucket || "N/A",
      row.behavior?.repeat_bucket || "N/A",
      row.behavior?.duration_ratio_bucket || "N/A",
      row.behavior?.song_diversity_bucket || "N/A",

      row.screening?.depression_level || "N/A",
      row.screening?.stress_level || "N/A",
    ]);

    autoTable(doc, {
      startY: 25,

      head: [[
        "Email",
        "Date",

        "Top Category",
        "Time of Day",
        "Session Length",
        "Volume",
        "Skips",
        "Repeats",
        "Song Duration",
        "Diversity",

        "Real Depression (PHQ-9)",
        "Real Stress (DASS-21)"
      ]],

      body: tableData,

      styles: {
        fontSize: 7
      },

      headStyles: {
        fillColor: [29, 185, 84]
      }
    });

    doc.save("research-dataset.pdf");
  };

  const getStatusColor = (level) => {
    const l = level?.toLowerCase();

    if (
      l === 'high' ||
      l === 'severe' ||
      l === 'extremely severe'
    ) {
      return 'text-red-500 border border-red-500/30 bg-red-500/10';
    }

    if (
      l === 'moderate' ||
      l === 'mild'
    ) {
      return 'text-yellow-500 border border-yellow-500/30 bg-yellow-500/10';
    }

    return 'text-spotify-green border border-spotify-green/30 bg-spotify-green/10';
  };

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden">

      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden bg-[#181818]">

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">

          {/* HEADER */}

          <div className="mb-8 flex justify-between items-center">

            <div>
              <h1 className="text-3xl font-bold text-white">
                Research Data Dashboard
              </h1>

              <p className="text-text-gray mt-2">
                Combined user listening behavior and REAL Clinical Screening Results.
              </p>
            </div>

            <button
              onClick={downloadPDF}
              className="px-5 py-3 bg-spotify-green hover:opacity-90 text-white font-bold rounded-lg"
            >
              Download PDF
            </button>

          </div>


          {loading ? (

            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
            </div>

          ) : (

            <div className="bg-[#181818] rounded-xl border border-spotify-gray overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full text-left border-collapse">

                  <thead>

                    <tr className="border-b border-spotify-gray text-xs uppercase tracking-wider text-white bg-[#282828]">

                      <th className="px-6 py-4 font-bold">
                        User Email
                      </th>

                      <th className="px-6 py-4 font-bold">
                        Date
                      </th>

                      <th className="px-6 py-4 font-bold text-spotify-green">
                        Listening Behavior Profile
                      </th>

                      <th className="px-6 py-4 font-bold text-center text-blue-400">
                        Real Depression (PHQ-9)
                      </th>

                      <th className="px-6 py-4 font-bold text-center text-blue-400">
                        Real Stress (DASS-21)
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-spotify-gray/50">

                    {data.map((row) => (

                      <tr
                        key={row.session_id}
                        className="hover:bg-[#282828] transition-colors align-middle"
                      >

                        {/* EMAIL */}

                        <td className="px-6 py-6 font-bold text-white text-sm">
                          {row.email}
                        </td>


                        {/* DATE */}

                        <td className="px-6 py-6 text-xs text-text-gray">

                          {new Date(row.date).toLocaleDateString()}

                          <br />

                        

                        </td>


                        {/* BEHAVIOR */}

                        <td className="px-6 py-6">

                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">

                            <div>
                              <span className="text-text-gray opacity-70 block">
                                Top Category
                              </span>

                              <span className="text-white capitalize">
                                {row.behavior?.song_category_mode || "N/A"}
                              </span>
                            </div>


                            <div>
                              <span className="text-text-gray opacity-70 block">
                                Time of Day
                              </span>

                              <span className="text-white">
                                {row.behavior?.listening_time_of_day || "N/A"}
                              </span>
                            </div>


                            <div>
                              <span className="text-text-gray opacity-70 block">
                                Session Length
                              </span>

                              <span className="text-white">
                                {row.behavior?.session_length_bucket || "N/A"}
                              </span>
                            </div>


                            <div>
                              <span className="text-text-gray opacity-70 block">
                                Volume
                              </span>

                              <span className="text-white">
                                {row.behavior?.volume_level_bucket || "N/A"}
                              </span>
                            </div>


                            <div>
                              <span className="text-text-gray opacity-70 block">
                                Skips
                              </span>

                              <span className="text-white">
                                {row.behavior?.skip_rate_bucket || "N/A"}
                              </span>
                            </div>


                            <div>
                              <span className="text-text-gray opacity-70 block">
                                Repeats
                              </span>

                              <span className="text-white">
                                {row.behavior?.repeat_bucket || "N/A"}
                              </span>
                            </div>


                            <div>
                              <span className="text-text-gray opacity-70 block">
                                Song Duration
                              </span>

                              <span className="text-white">
                                {row.behavior?.duration_ratio_bucket || "N/A"}
                              </span>
                            </div>


                            <div>
                              <span className="text-text-gray opacity-70 block">
                                Diversity
                              </span>

                              <span className="text-white">
                                {row.behavior?.song_diversity_bucket || "N/A"}
                              </span>
                            </div>

                          </div>

                        </td>


                        {/* PHQ9 */}

                        <td className="px-6 py-6 text-center">

                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(row.screening?.depression_level)}`}>

                            {row.screening?.depression_level || "N/A"}

                          </span>

                        </td>


                        {/* DASS */}

                        <td className="px-6 py-6 text-center">

                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(row.screening?.stress_level)}`}>

                            {row.screening?.stress_level || "N/A"}

                          </span>

                        </td>

                      </tr>

                    ))}


                    {data.length === 0 && (

                      <tr>

                        <td
                          colSpan="5"
                          className="p-8 text-center text-text-gray"
                        >
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