import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  /* HANDLE ANSWER */
  const handleAnswer = (key, value) => {
    setAnswers({
      ...answers,
      [key]: value
    });
  };

  /* CALCULATE SCORE */
  const calculateScore = () => {
    const totalQuestions = phqQuestions.length + stressQuestions.length;

    if (Object.keys(answers).length < totalQuestions) {
      alert("Please answer all questions before submitting. / කරුණාකර සියලුම ප්‍රශ්න වලට පිළිතුරු සපයන්න.");
      return;
    }

    let phqScore = 0;
    let stressScore = 0;

    phqQuestions.forEach((q, i) => {
      phqScore += answers[`phq${i}`] || 0;
    });

    stressQuestions.forEach((q, i) => {
      stressScore += answers[`stress${i}`] || 0;
    });

    let depressionLevel = "Low";
    if (phqScore >= 15) {
      depressionLevel = "High";
    } else if (phqScore >= 8) {
      depressionLevel = "Moderate";
    }

    let stressLevel = "Low";
    if (stressScore >= 15) {
      stressLevel = "High";
    } else if (stressScore >= 8) {
      stressLevel = "Moderate";
    }

    setResult({
      phqScore,
      stressScore,
      depressionLevel,
      stressLevel
    });

    /* mark questionnaire completed */
    localStorage.setItem("questionnaireCompleted", "true");

    /* redirect */
    setTimeout(() => {
      navigate("/musichome");
    }, 3000);
  };

  /* TABLE RENDER HELPER */
  const renderTable = (title, questions, prefix) => (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-indigo-600 pl-3">
        {title}
      </h2>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse bg-white min-w-[800px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <th className="p-4 font-semibold w-2/5">Question / ප්‍රශ්නය</th>
              {options.map((opt) => (
                <th key={opt.value} className="p-4 text-center font-semibold text-sm w-[15%]">
                  {opt.en}
                  <div className="text-xs text-slate-500 font-normal mt-1">{opt.si}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions.map((q, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-800 text-sm">
                  <span className="font-medium">{i + 1}. {q.en}</span>
                  <div className="text-slate-500 mt-1">{q.si}</div>
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
                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Mental Health Questionnaire
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            මානසික සෞඛ්‍ය ප්‍රශ්නාවලිය
          </p>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Over the last 2 weeks, how often have you been bothered by any of the following problems? Please select the best option for each question.
          </p>
        </div>

        {/* TABLES */}
        {renderTable("PHQ-9 Depression Assessment", phqQuestions, "phq")}
        {renderTable("DASS-21 Stress Assessment", stressQuestions, "stress")}

        {/* SUBMIT BUTTON */}
        <div className="flex justify-center mt-8">
          <button
            onClick={calculateScore}
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-8 py-3 rounded-lg font-bold text-lg shadow-md hover:shadow-lg"
          >
            Submit Questionnaire
          </button>
        </div>

        {/* RESULT */}
        {result && (
          <div className="mt-10 bg-white p-8 rounded-xl border border-indigo-100 shadow-lg max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-4">
              Results / ප්‍රතිඵල
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Depression (PHQ-9)</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{result.phqScore}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold 
                  ${result.depressionLevel === 'High' ? 'bg-red-100 text-red-700' : 
                    result.depressionLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'}`}>
                  {result.depressionLevel}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Stress (DASS-21)</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{result.stressScore}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold 
                  ${result.stressLevel === 'High' ? 'bg-red-100 text-red-700' : 
                    result.stressLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'}`}>
                  {result.stressLevel}
                </span>
              </div>
            </div>
            
            <p className="mt-6 text-indigo-600 font-medium animate-pulse">
              Redirecting to Music Home...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}