import { useAuth } from "@/contexts/AuthProvider";
import { useNavigate } from "react-router-dom";

export function useErrorHandler() {
    const auth = useAuth();
    const navigate = useNavigate();

    const handleError = (error: any, setError: (msg: string) => void) => {
        console.log(error);
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
                auth?.logout();
                navigate("/login");
            } else if (status === 400 && data) {
                if ("error" in data) {
                    setError(data.error);
                } else {
                    setError("Error: Bad request");
                }
            } else if ("title" in error) {
                setError(error.title);
            } else {
                setError(error.message);
            }
        } else {
            setError(error.message);
        }
    };

    return handleError;
}