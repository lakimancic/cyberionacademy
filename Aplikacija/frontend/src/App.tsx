import Background from "./components/Background/Background";
import AuthProvider from "./contexts/AuthProvider";
import Routes from "./routes/Routes";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import "./App.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  return (
    <>
      <ThemeProvider theme={darkTheme}>
        <AuthProvider>
          <Background />
          <Routes />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
