import { useState } from "react";
import { useNavigate } from "react-router-dom";

const options = [
{ value:0,en:"Not at all",si:"කිසිසේත් නැහැ"},
{ value:1,en:"Several days",si:"දින කිහිපයක්"},
{ value:2,en:"More than half the days",si:"බොහෝ දින"},
{ value:3,en:"Nearly every day",si:"සෑම දිනම"}
];

const phqQuestions=[
{en:"Little interest or pleasure in doing things",si:"කාර්යයන් කිරීමේ උනන්දුව හෝ සතුට අඩු වීම"},
{en:"Feeling down, depressed, or hopeless",si:"දුක හෝ බලාපොරොත්තු නැති බව දැනීම"},
{en:"Trouble falling or staying asleep, or sleeping too much",si:"නින්ද යාමට අපහසු වීම හෝ අධික නින්ද"},
{en:"Feeling tired or having little energy",si:"අධික වෙහෙස දැනීම"},
{en:"Poor appetite or overeating",si:"ආහාරයට කැමැත්ත අඩු වීම හෝ අධික ආහාර ගැනීම"},
{en:"Feeling bad about yourself",si:"ඔබ ගැන නරක හැඟීමක් දැනීම"},
{en:"Trouble concentrating on things",si:"අවධානය යොමු කිරීමට අපහසු වීම"},
{en:"Moving or speaking slowly or being restless",si:"මන්දගාමීව හෝ restlessness දැනීම"},
{en:"Thoughts that you would be better off dead",si:"මිය යාම පිළිබඳ සිතුවිලි"}
];

const stressQuestions=[
{en:"I found it hard to wind down",si:"මට විවේක ගන්න අපහසු වුණා"},
{en:"I tended to over-react to situations",si:"මම තත්ත්වයන්ට අධික ලෙස ප්‍රතිචාර දැක්වුවා"},
{en:"I felt that I was using a lot of nervous energy",si:"මට අධික nervous energy තිබුණා"},
{en:"I found myself getting agitated",si:"මට ඉක්මනින් agitation ඇති වුණා"},
{en:"I found it difficult to relax",si:"මට විවේක ගන්න අපහසු වුණා"},
{en:"I was intolerant of anything that kept me from getting on",si:"බාධා වලට මට ඉවසන්න අමාරු වුණා"},
{en:"I felt that I was rather touchy",si:"මම ඉක්මනින් කෝපයට පත්වුණා"}
];

export default function Questionnaire(){

const navigate=useNavigate();
const[answers,setAnswers]=useState({});
const[result,setResult]=useState(null);

const handleAnswer=(key,value)=>{
setAnswers({...answers,[key]:value});
};

const calculateScore=()=>{

const totalQuestions=phqQuestions.length+stressQuestions.length;

if(Object.keys(answers).length<totalQuestions){
alert("Please answer all questions before submitting.");
return;
}

let phqScore=0;
let stressScore=0;

phqQuestions.forEach((q,i)=>{
phqScore+=answers[`phq${i}`]||0;
});

stressQuestions.forEach((q,i)=>{
stressScore+=answers[`stress${i}`]||0;
});

let depressionLevel="Low";
if(phqScore>=15) depressionLevel="High";
else if(phqScore>=8) depressionLevel="Moderate";

let stressLevel="Low";
if(stressScore>=15) stressLevel="High";
else if(stressScore>=8) stressLevel="Moderate";

setResult({
phqScore,
stressScore,
depressionLevel,
stressLevel
});

localStorage.setItem("questionnaireCompleted","true");

setTimeout(()=>{
navigate("/musichome");
},2000);

};

return(

<div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-10">

<div className="max-w-4xl mx-auto">

<h1 className="text-4xl font-bold text-center text-slate-900 mb-2">
Mental Health Questionnaire
</h1>

<p className="text-center text-slate-500 mb-10">
මානසික සෞඛ්‍ය ප්‍රශ්නාවලිය
</p>

{/* PHQ9 */}

<h2 className="text-xl font-semibold text-slate-800 mb-4">
PHQ-9 Depression
</h2>

{phqQuestions.map((q,i)=>(

<div key={i} className="bg-white border border-slate-200 rounded-xl shadow-md p-6 mb-6 hover:shadow-lg transition">

<p className="font-semibold text-slate-900 text-lg">
{i+1}. {q.en}
<br/>
<span className="text-slate-500 text-sm">{q.si}</span>
</p>

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">

{options.map(opt=>(

<label
key={opt.value}
className="flex items-center gap-3 border border-slate-200 p-4 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition"
>

<input
type="radio"
className="accent-indigo-600"
name={`phq${i}`}
onChange={()=>handleAnswer(`phq${i}`,opt.value)}
/>

<span className="text-sm">
{opt.en}
<br/>
<span className="text-slate-400">{opt.si}</span>
</span>

</label>

))}

</div>

</div>

))}

{/* STRESS */}

<h2 className="text-xl font-semibold text-slate-800 mt-10 mb-4">
DASS-21 Stress
</h2>

{stressQuestions.map((q,i)=>(

<div key={i} className="bg-white border border-slate-200 rounded-xl shadow-md p-6 mb-6 hover:shadow-lg transition">

<p className="font-semibold text-slate-900 text-lg">
{i+1}. {q.en}
<br/>
<span className="text-slate-500 text-sm">{q.si}</span>
</p>

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">

{options.map(opt=>(

<label
key={opt.value}
className="flex items-center gap-3 border border-slate-200 p-4 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition"
>

<input
type="radio"
className="accent-indigo-600"
name={`stress${i}`}
onChange={()=>handleAnswer(`stress${i}`,opt.value)}
/>

<span className="text-sm">
{opt.en}
<br/>
<span className="text-slate-400">{opt.si}</span>
</span>

</label>

))}

</div>

</div>

))}

<button
onClick={calculateScore}
className="bg-indigo-600 hover:bg-indigo-700 shadow-md text-white px-8 py-3 rounded-lg font-semibold mt-6 transition"
>
Submit Questionnaire
</button>

{result &&(

<div className="mt-8 bg-white p-6 rounded-xl border shadow-md">

<h2 className="text-xl font-bold text-slate-900 mb-4">
Result / ප්‍රතිඵල
</h2>

<p>PHQ-9 Score: {result.phqScore}</p>

<p>
Depression Level:
<span className="ml-2 font-semibold">
{result.depressionLevel}
</span>
</p>

<p className="mt-4">Stress Score: {result.stressScore}</p>

<p>
Stress Level:
<span className="ml-2 font-semibold">
{result.stressLevel}
</span>
</p>

</div>

)}

</div>

</div>

);

}
