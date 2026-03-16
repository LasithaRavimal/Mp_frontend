import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { showSuccessToast, showErrorToast } from "../../utils/notifications"; // Assuming you have this!

/* OPTIONS */
const options = [
  { value: 0, en: "Not at all", si: "කිසිසේත් නැහැ" },
  { value: 1, en: "Several days", si: "දින කිහිපයක්" },
  { value: 2, en: "More than half the days", si: "බොහෝ දින" },
  { value: 3, en: "Nearly every day", si: "සෑම දිනම" }
];

/* PHQ-9 QUESTIONS */
const phqQuestions = [
  { en: "Little interest or pleasure in doing things", si: "කාර්යයන් කිරීමේ උනන්දුව හෝ සතුට අඩු වීම" },
  { en: "Feeling down, depressed, or hopeless", si: "දුක හෝ බලාපොරොත්තු නැති බව දැනීම" },
  { en: "Trouble falling or staying asleep, or sleeping too much", si: "නින්ද යාමට අපහසු වීම හෝ අධික නින්ද" },
  { en: "Feeling tired or having little energy", si: "අධික වෙහෙස දැනීම" },
  { en: "Poor appetite or overeating", si: "ආහාරයට කැමැත්ත අඩු වීම හෝ අධික ආහාර ගැනීම" },
  { en: "Feeling bad about yourself", si: "ඔබ ගැන නරක හැඟීමක් දැනීම" },
  { en: "Trouble concentrating on things", si: "අවධානය යොමු කිරීමට අපහසු වීම" },
  { en: "Moving or speaking slowly or being restless", si: "මන්දගාමීව හෝ නොසන්සුන් බව දැනීම" },
  { en: "Thoughts that you would be better off dead", si: "මිය යාම පිළිබඳ සිතුවිලි" }
];

/* DASS-21 STRESS QUESTIONS */
const stressQuestions = [
  { en: "I found it hard to wind down", si: "මට විවේක ගන්න අපහසු වුණා" },
  { en: "I tended to over-react to situations", si: "මම තත්ත්වයන්ට අධික ලෙස ප්‍රතිචාර දැක්වුවා" },
  { en: "I felt that I was using a lot of nervous energy", si: "මට අධික nervous energy තිබුණා" },
  { en: "I found myself getting agitated", si: "මට ඉක්මනින් agitation ඇති වුණා" },
  { en: "I found it difficult to relax", si: "මට විවේක ගන්න අපහසු වුණා" },
  { en: "I was intolerant of anything that kept me from getting on", si: "බාධා වලට මට ඉවසන්න අමාරු වුණා" },
  { en: "I felt that I was rather touchy", si: "මම ඉක්මනින් කෝපයට පත්වුණා" }
];

export default function Questionnaire() {
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* HANDLE ANSWER */
  const handleAnswer = (key, value) => {
    setAnswers({
      ...answers,
      [key]: value
    });
  };

  /* SUBMIT AND CALCULATE SCORE */
  const handleSubmit = async () => {
    const totalQuestions = phqQuestions.length + stressQuestions.length;

    if (Object.keys(answers).length < totalQuestions) {
      showErrorToast("Please answer all questions before submitting. / කරුණාකර සියලුම ප්‍රශ්න වලට පිළිතුරු සපයන්න.");
      return;
    }

    setIsSubmitting(true);

    let phqScore = 0;
    let stressScore = 0;
    
    // Format arrays for the backend
    const phq9_answers = [];
    const dass21_answers = [];

    phqQuestions.forEach((q, i) => {
      const val = answers[`phq${i}`] || 0;
      phqScore += val;
      phq9_answers.push(val);
    });

    stressQuestions.forEach((q, i) => {
      const val = answers[`stress${i}`] || 0;
      stressScore += val;
      dass21_answers.push(val);
    });

    let depressionLevel = "Low";
    if (phqScore >= 15) depressionLevel = "High";
    else if (phqScore >= 8) depressionLevel = "Moderate";

    let stressLevel = "Low";
    if (stressScore >= 15) stressLevel = "High";
    else if (stressScore >= 8) stressLevel = "Moderate";

    // Show results instantly on UI
    setResult({
      phqScore,
      stressScore,
      depressionLevel,
      stressLevel
    });

    try {
      // 1. Send data to backend
      await apiClient.post("/questionnaire/submit", {
        phq9_answers,
        dass21_answers
      });

      // 2. Save today's date in local storage for the "Once a day" rule
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem("lastAssessmentDate", today);

      showSuccessToast("Assessment complete! Redirecting to player...");

      // 3. Redirect to Music Library
      setTimeout(() => {
        navigate("/library");
      }, 3000);

    } catch (error) {
      console.error("Failed to submit questionnaire:", error);
      showErrorToast("Failed to save to server, but redirecting to player.");
      
      setTimeout(() => {
        navigate("/library");
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* TABLE RENDER HELPER */
  const renderTable = (title, questions, prefix) => (
    <div className="mb-12">
      <h2 className="text-xl font-bold mb-4 text-white border-l-4 border-spotify-green pl-3">
        {title}
      </h2>
      <div className="overflow-x-auto shadow-xl rounded-lg border border-spotify-gray bg-spotify-dark-gray">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-spotify-light-gray text-white border-b border-spotify-gray">
              <th className="p-4 font-semibold w-2/5">Question / ප්‍රශ්නය</th>
              {options.map((opt) => (
                <th key={opt.value} className="p-4 text-center font-semibold text-sm w-[15%]">
                  {opt.en}
                  <div className="text-xs text-text-gray font-normal mt-1">{opt.si}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-spotify-gray/50">
            {questions.map((q, i) => (
              <tr key={i} className="hover:bg-spotify-light-gray/30 transition-colors">
                <td className="p-4 text-white text-sm">
                  <span className="font-medium">{i + 1}. {q.en}</span>
                  <div className="text-text-gray mt-1">{q.si}</div>
                </td>
                {options.map((opt) => {
                  const inputName = `${prefix}${i}`;
                  const isChecked = answers[inputName] === opt.value;

                  return (
                    <td
                      key={opt.value}
                      className="p-4 text-center cursor-pointer"
                      onClick={() => handleAnswer(inputName, opt.value)}
                    >
                      <input
                        type="radio"
                        name={inputName}
                        value={opt.value}
                        checked={isChecked}
                        onChange={() => handleAnswer(inputName, opt.value)}
                        className="w-5 h-5 accent-spotify-green cursor-pointer"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-spotify-black py-10 px-4 sm:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Mental Health Assessment
          </h1>
          <p className="text-spotify-green mt-2 text-lg font-medium">
            මානසික සෞඛ්‍ය ප්‍රශ්නාවලිය
          </p>
          <p className="text-sm text-text-gray mt-4 max-w-2xl mx-auto">
            Over the last 2 weeks, how often have you been bothered by any of the following problems? Please select the best option for each question.
          </p>
        </div>

        {/* TABLES */}
        {renderTable("PHQ-9 Depression Assessment", phqQuestions, "phq")}
        {renderTable("DASS-21 Stress Assessment", stressQuestions, "stress")}

        {/* SUBMIT BUTTON */}
        {!result && (
          <div className="flex justify-center mt-8 pb-12">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-spotify-green hover:bg-spotify-green-hover transition-all transform hover:scale-105 text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0_0_15px_rgba(29,185,84,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-10 bg-spotify-dark-gray p-8 rounded-2xl border border-spotify-gray shadow-2xl max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-spotify-gray pb-4">
              Results / ප්‍රතිඵල
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Depression Result */}
              <div className="bg-spotify-black p-6 rounded-xl border border-spotify-light-gray">
                <h3 className="text-xs text-text-gray uppercase tracking-widest font-semibold mb-2">Depression (PHQ-9)</h3>
                <p className="text-4xl font-bold text-white mb-3">{result.phqScore}</p>
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold 
                  ${result.depressionLevel === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                    result.depressionLevel === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                    'bg-spotify-green/20 text-spotify-green border border-spotify-green/30'}`}>
                  {result.depressionLevel}
                </span>
              </div>

              {/* Stress Result */}
              <div className="bg-spotify-black p-6 rounded-xl border border-spotify-light-gray">
                <h3 className="text-xs text-text-gray uppercase tracking-widest font-semibold mb-2">Stress (DASS-21)</h3>
                <p className="text-4xl font-bold text-white mb-3">{result.stressScore}</p>
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold 
                  ${result.stressLevel === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                    result.stressLevel === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                    'bg-spotify-green/20 text-spotify-green border border-spotify-green/30'}`}>
                  {result.stressLevel}
                </span>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-3 text-spotify-green font-medium animate-pulse">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Redirecting to Music Player...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}