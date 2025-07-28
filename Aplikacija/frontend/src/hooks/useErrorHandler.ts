import { useAuth } from "@/contexts/AuthProvider";
import { useNavigate } from "react-router-dom";

export function useErrorHandler() {
    const auth = useAuth();
    const navigate = useNavigate();

    const handleError = (error: any, setError: (msg: string) => void) => {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
                auth?.logout();
                navigate("/login");
            } else if (status === 400 && data) {
                if(typeof data === 'string') {
                    setError(data);
                } else if(typeof data === 'object' && 'errors' in data) {
                    const errors = Object.values(data['errors']) as string[][];
                    const match = errors[0][0].match(/max request body size is (\d+) bytes\./);
                    if(match) {
                        const maxMB = Math.round(parseInt(match[1], 10) / (1024 * 1024));
                        setError(`File is too large. Max size is ${maxMB}MB.`);
                    } else {
                        setError(errors[0][0]);
                    }
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