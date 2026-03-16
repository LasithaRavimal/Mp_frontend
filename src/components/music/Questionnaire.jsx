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

  /* SUBMIT DATA & REDIRECT INSTANTLY */
  const handleSubmit = async () => {
    const totalQuestions = phqQuestions.length + stressQuestions.length;

    if (Object.keys(answers).length < totalQuestions) {
      showErrorToast("Please answer all questions before submitting. / කරුණාකර සියලුම ප්‍රශ්න වලට පිළිතුරු සපයන්න.");
      return;
    }

    setIsSubmitting(true);

    // Format arrays for the backend
    const phq9_answers = [];
    const dass21_answers = [];

    phqQuestions.forEach((q, i) => phq9_answers.push(answers[`phq${i}`] || 0));
    stressQuestions.forEach((q, i) => dass21_answers.push(answers[`stress${i}`] || 0));

    try {
      // 1. Send data to backend (Backend calculates the score and saves it)
      await apiClient.post("/questionnaire/submit", {
        phq9_answers,
        dass21_answers
      });

      // 2. Save today's date in local storage so they don't have to take it again today
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem("lastAssessmentDate", today);

      showSuccessToast("Assessment saved! Redirecting to player...");

      // 3. Immediately redirect to the player (Results remain hidden!)
      navigate("/library");

    } catch (error) {
      console.error("Failed to submit questionnaire:", error);
      showErrorToast("Failed to save to server, but redirecting to player.");
      navigate("/library");
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
                        checked={answers[inputName] === opt.value}
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
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Mental Health Assessment</h1>
          <p className="text-spotify-green mt-2 text-lg font-medium">මානසික සෞඛ්‍ය ප්‍රශ්නාවලිය</p>
          <p className="text-sm text-text-gray mt-4 max-w-2xl mx-auto">
            Please select the best option for each question. Your results will be calculated and shown after your listening session.
          </p>
        </div>

        {renderTable("PHQ-9 Depression Assessment", phqQuestions, "phq")}
        {renderTable("DASS-21 Stress Assessment", stressQuestions, "stress")}

        <div className="flex justify-center mt-8 pb-12">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-spotify-green hover:bg-spotify-green-hover transition-all transform hover:scale-105 text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0_0_15px_rgba(29,185,84,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving Answers..." : "Submit & Go To Player"}
          </button>
        </div>
      </div>
    </div>
  );
}