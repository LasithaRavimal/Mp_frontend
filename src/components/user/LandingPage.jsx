import { useNavigate } from "react-router-dom";

const LandingPage = () => {

const navigate = useNavigate();

return (

<div className="flex flex-col items-center justify-center min-h-screen">

<h1 className="text-6xl font-bold text-white">
M_Track
</h1>

<button
onClick={() => navigate("/questionnaire")}
className="px-6 py-3 mt-8 bg-spotify-green text-white rounded-lg"
>
Start Assessment
</button>

</div>

);

}

export default LandingPage;