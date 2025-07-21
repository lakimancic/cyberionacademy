import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import './Welcome.css';

function Home() {
    const navigate = useNavigate();

    return <>
        <main>
            <h1>Cyberion<span>Academy</span></h1>
            <p>
                Welcome to Cyberion Academy — a platform for learning cybersecurity, <br />
                from absolute beginner to expert hacker, with a personalized experience. <br />
                Register now to start your cybersecurity journey, or <br />
                Log-in to continue sharpening your skills.
            </p>
            <div className="button-container">
                <button type="button">Register</button>
                <button type="button" onClick={() => navigate('/login')}>Login</button>
            </div>
            <Footer />
        </main>
    </>
}

export default Home;