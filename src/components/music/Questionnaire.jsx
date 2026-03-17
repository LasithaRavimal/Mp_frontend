import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { showSuccessToast, showErrorToast } from "../../utils/notifications";

/* OPTIONS */
const options = [
  { value: 0, en: "Not at all", si: "කිසිසේත් නැහැ" },
  { value: 1, en: "Several days", si: "දින කිහිපයක්" },
  { value: 2, en: "More than half the days", si: "බොහෝ දින" },
  { value: 3, en: "Nearly every day", si: "සෑම දිනම" }
];

/* PHQ-9 & DASS-21 QUESTIONS */
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* HANDLE ANSWER */
  const handleAnswer = (key, value) => {
    setAnswers({ ...answers, [key]: value });
  };

  /* BULLETPROOF SUBMIT DATA & REDIRECT */
  const handleSubmit = async () => {
    const totalQuestions = phqQuestions.length + stressQuestions.length;

    // Validation Check
    if (Object.keys(answers).length < totalQuestions) {
      try {
        showErrorToast("Please answer all questions before submitting.");
      } catch (e) {
        alert("Please answer all questions before submitting.");
      }
      return;
    }

    setIsSubmitting(true);

    const phq9_answers = [];
    const dass21_answers = [];

    phqQuestions.forEach((q, i) => phq9_answers.push(answers[`phq${i}`] || 0));
    stressQuestions.forEach((q, i) => dass21_answers.push(answers[`stress${i}`] || 0));

    try {
      // 1. Send data with a strict 8-second timeout so it NEVER freezes forever
      await apiClient.post("/questionnaire/submit", { 
        phq9_answers, 
        dass21_answers 
      }, { timeout: 8000 });

      // 2. Save date locally
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem("lastAssessmentDate", today);

      try { showSuccessToast("Assessment saved! Redirecting to player..."); } catch(e) {}
      
      // 3. Force Redirect
      navigate("/musichome");

    } catch (error) {
      console.error("Failed to submit questionnaire:", error);
      
      // 👉 EXTRACT THE REAL ERROR FROM THE BACKEND
      const realError = error.response?.data?.detail || error.message || "Unknown Server Error";
      
      // 🚨 EMERGENCY FALLBACK: Even if the server fails, UNFREEZE and redirect!
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem("lastAssessmentDate", today); 
      
      try { 
        showErrorToast(`Failed to save: ${realError}. Redirecting...`); 
      } catch(e) { 
        alert(`Failed to save: ${realError}. Redirecting...`); 
      }
      
      navigate("/musichome");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* TABLE RENDER HELPER */
  const renderTable = (title, questions, prefix) => (
    <div className="mb-8 md:mb-10">
      <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-800 border-l-4 border-indigo-600 pl-3">
        {title}
      </h2>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse bg-white min-w-[700px] md:min-w-[800px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <th className="p-3 md:p-4 font-semibold w-2/5 text-sm md:text-base">Question / ප්‍රශ්නය</th>
              {options.map((opt) => (
                <th key={opt.value} className="p-2 md:p-4 text-center font-semibold text-xs md:text-sm w-[15%]">
                  {opt.en}
                  <div className="text-[10px] md:text-xs text-slate-500 font-normal mt-1">{opt.si}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions.map((q, i) => {
              const inputName = `${prefix}${i}`;
              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 md:p-4 text-slate-800 text-xs md:text-sm">
                    <span className="font-medium">{i + 1}. {q.en}</span>
                    <div className="text-slate-500 mt-1">{q.si}</div>
                  </td>
                  {options.map((opt) => (
                    <td
                      key={opt.value}
                      className="p-2 md:p-4 text-center cursor-pointer"
                      onClick={() => handleAnswer(inputName, opt.value)}
                    >
                      <input
                        type="radio"
                        name={inputName}
                        value={opt.value}
                        checked={answers[inputName] === opt.value}
                        onChange={() => handleAnswer(inputName, opt.value)}
                        className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-6 md:py-10 px-4 sm:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 md:mb-10 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Mental Health Assessment</h1>
          <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">මානසික සෞඛ්‍ය ප්‍රශ්නාවලිය</p>
          <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Please select the best option for each question. Your results will be calculated and shown after your listening session.
          </p>
        </div>

        {renderTable("PHQ-9 Depression Assessment", phqQuestions, "phq")}
        {renderTable("DASS-21 Stress Assessment", stressQuestions, "stress")}

        <div className="flex justify-center mt-6 pb-12">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-8 py-3 md:px-10 md:py-4 rounded-lg font-bold text-base md:text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving Answers..." : "Submit & Go To Player"}
          </button>
        </div>
      </div>
    </div>
  );
}