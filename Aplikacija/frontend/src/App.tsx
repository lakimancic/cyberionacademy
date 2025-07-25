import Background from "./components/Background/Background";
import AuthProvider from "./contexts/AuthProvider";
import Routes from "./routes/Routes";
import './App.css';

function App() {
    return (
        <>
            <AuthProvider>
                <Background />
                <Routes />
            </AuthProvider>
        </>
    )
}

export default App
