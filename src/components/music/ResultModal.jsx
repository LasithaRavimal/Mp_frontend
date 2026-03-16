import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdClose, MdAssessment, MdCheckCircle } from 'react-icons/md';
import apiClient from '../../../api/apiClient';

const PredictionModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLatestQuestionnaire();
    }
  }, [isOpen]);

  const fetchLatestQuestionnaire = async () => {
    try {
      const response = await apiClient.get('/questionnaire/latest');
      setQuestionnaireData(response.data);
    } catch (error) {
      console.error("Failed to fetch questionnaire", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getLevelColor = (level) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (l === 'moderate') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-spotify-green/20 text-spotify-green border-spotify-green/30';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-spotify-dark-gray border border-spotify-gray rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-spotify-gray bg-spotify-black/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-spotify-green">M_Track</span> Session Complete
          </h2>
          <button onClick={onClose} className="text-text-gray hover:text-white transition-colors">
            <MdClose className="text-3xl" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-8">
          
          {/* SUCCESS MESSAGE */}
          <div className="flex items-center gap-4 bg-spotify-green/10 border border-spotify-green/30 p-4 rounded-xl mb-8">
             <MdCheckCircle className="text-4xl text-spotify-green" />
             <div>
               <h3 className="text-white font-bold text-lg">Listening Data Logged</h3>
               <p className="text-sm text-text-gray">Your music session behavior has been successfully saved to the database for research purposes.</p>
             </div>
          </div>

          {/* CLINICAL QUESTIONNAIRE REMINDER */}
          <div className="bg-spotify-black rounded-xl p-6 border border-spotify-gray">
            <div className="flex items-center gap-3 mb-6 border-b border-spotify-gray pb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <MdAssessment className="text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Your Daily Assessment</h3>
                <p className="text-xs text-text-gray">Based on today's PHQ-9 & DASS-21</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : questionnaireData ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-text-gray mb-2 uppercase tracking-wider font-semibold">Self-Reported Stress</p>
                  <span className={`px-4 py-2 rounded-lg text-lg font-bold border block text-center ${getLevelColor(questionnaireData.stress_level)}`}>
                    {questionnaireData.stress_level}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-text-gray mb-2 uppercase tracking-wider font-semibold">Self-Reported Depression</p>
                  <span className={`px-4 py-2 rounded-lg text-lg font-bold border block text-center ${getLevelColor(questionnaireData.depression_level)}`}>
                    {questionnaireData.depression_level}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <p className="text-text-gray text-sm">No clinical data found for today.</p>
                <button 
                  onClick={() => { onClose(); navigate('/questionnaire'); }}
                  className="text-indigo-400 text-sm hover:underline"
                >
                  Take Assessment Now
                </button>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="mt-8 pt-6 border-t border-spotify-gray flex justify-end gap-4">
            <button
              onClick={() => {
                onClose();
                navigate('/music-profile');
              }}
              className="px-6 py-3 rounded-full text-white font-bold bg-transparent border-2 border-spotify-gray hover:border-white transition-colors"
            >
              View Profile
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-full text-white font-bold bg-spotify-green hover:bg-spotify-green-hover transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionModal;