import Welcome from "./pages/Welcome/Welcome";
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from "./pages/Auth/Login";
import Background from "./components/Background/Background";
import './App.css';

function App() {
    const location = useLocation();

    return (
        <>
            <Background />
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </>
    )
}

export default App
