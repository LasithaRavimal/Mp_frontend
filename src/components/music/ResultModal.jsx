import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdClose, MdAssessment, MdAudiotrack, MdInfo } from 'react-icons/md';
import apiClient from '../../api/apiClient';

const PredictionModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [musicPrediction, setMusicPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      // 1. Get Questionnaire Results
      const qRes = await apiClient.get('/questionnaire/latest');
      setQuestionnaireData(qRes.data);

      // 2. Get the specific session data
      const sRes = await apiClient.get('/sessions'); 
      
      if (sRes.data && sRes.data.length > 0) {
        // Find the most recent session that has a 'prediction' object
        const latestWithPrediction = sRes.data.find(s => s.prediction) || sRes.data[0];
        setMusicPrediction(latestWithPrediction.prediction);
      }
    } catch (error) {
      console.error("Data fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (level) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'text-red-500 border-red-500/30 bg-red-500/10';
    if (l === 'moderate') return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
    return 'text-spotify-green border-spotify-green/30 bg-spotify-green/10';
  };

  // ✅ NEW FUNCTION: Closes modal AND redirects to landing page
  const handleDoneClick = () => {
    if (onClose) onClose();
    navigate('/landing');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-spotify-dark-gray border border-spotify-gray rounded-2xl md:rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* HEADER */}
        <div className="p-4 md:p-6 border-b border-spotify-gray flex justify-between items-center bg-spotify-black/40">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Analysis Results</h2>
            <p className="text-text-gray text-xs md:text-sm">Cross-referencing behavior with screening</p>
          </div>
          <button onClick={handleDoneClick} className="p-2 hover:bg-spotify-gray rounded-full text-white transition-colors">
            <MdClose size={24} className="md:w-7 md:h-7" />
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          
          {/* SECTION 1: MUSIC BEHAVIOR PREDICTION */}
          <div className="relative p-5 md:p-6 rounded-2xl bg-gradient-to-br from-spotify-light-gray to-spotify-black border border-spotify-gray">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <MdAudiotrack className="text-spotify-green text-xl md:text-2xl" />
              <h3 className="text-white font-bold uppercase tracking-widest text-xs md:text-sm">Behavioral Prediction</h3>
            </div>

            {loading ? <div className="h-20 animate-pulse bg-spotify-gray rounded-lg" /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className={`p-4 rounded-xl border ${getStatusColor(musicPrediction?.depression_level)}`}>
                  <p className="text-[10px] md:text-xs opacity-70 mb-1 uppercase">Depression Indicator</p>
                  <p className="text-lg md:text-xl font-black">{musicPrediction?.depression_level || "Analyzing..."}</p>
                </div>
                <div className={`p-4 rounded-xl border ${getStatusColor(musicPrediction?.stress_level)}`}>
                  <p className="text-[10px] md:text-xs opacity-70 mb-1 uppercase">Stress Indicator</p>
                  <p className="text-lg md:text-xl font-black">{musicPrediction?.stress_level || "Analyzing..."}</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-start gap-2 text-[10px] text-text-gray italic">
              <MdInfo size={14} className="shrink-0" />
              <span>This prediction is based on your listening habits (time of day, song choice, and skip frequency).</span>
            </div>
          </div>

          {/* SECTION 2: CLINICAL SCREENING RESULTS */}
          <div className="p-5 md:p-6 rounded-2xl bg-spotify-black/40 border border-spotify-gray">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <MdAssessment className="text-indigo-400 text-xl md:text-2xl" />
              <h3 className="text-white font-bold uppercase tracking-widest text-xs md:text-sm">Self-Reported Screening</h3>
            </div>

            {loading ? <div className="h-20 animate-pulse bg-spotify-gray rounded-lg" /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-spotify-light-gray/50 p-4 rounded-xl">
                  <p className="text-[10px] md:text-xs text-text-gray mb-1 uppercase">PHQ-9 Result</p>
                  <p className="text-base md:text-lg font-bold text-white">{questionnaireData?.depression_level || "N/A"}</p>
                </div>
                <div className="bg-spotify-light-gray/50 p-4 rounded-xl">
                  <p className="text-[10px] md:text-xs text-text-gray mb-1 uppercase">DASS-21 Result</p>
                  <p className="text-base md:text-lg font-bold text-white">{questionnaireData?.stress_level || "N/A"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 bg-spotify-black/60 border-t border-spotify-gray flex justify-center">
          <button 
            onClick={handleDoneClick} 
            className="w-full md:w-auto bg-spotify-green text-black font-bold px-12 py-3 rounded-full hover:scale-105 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictionModal;