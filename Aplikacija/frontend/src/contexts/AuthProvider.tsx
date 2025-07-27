import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import api from '@/lib/api';

interface AuthContextType {
    token: string | null;
    setToken: (newToken: string | null) => void;
    setRefreshToken: (newToken: string | null) => void;
    logout: () => void;
    refreshToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

function AuthProvider({ children } : AuthProviderProps) {
    const [token, setToken_] = useState<string | null>(() => {
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
            api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        }
        return savedToken;
    });
    const [refresh, setRefresh] = useState<string | null>(localStorage.getItem("refreshToken"));

    const setToken = (newToken: string | null) => {
        setToken_(newToken);
        if(newToken) {
            api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
            localStorage.setItem("token", newToken);
        } else {
            delete api.defaults.headers.common["Authorization"];
            localStorage.removeItem("token");
        }
    }

    const setRefreshToken = (newRefreshToken: string | null) => {
        setRefresh(newRefreshToken);
        if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
        } else {
            localStorage.removeItem("refreshToken");
        }
    };

    const logout = () => {
        setToken(null);
        setRefreshToken(null);
    };

    const refreshToken = async () => {
        if (!refresh) return logout();

        try {
            const response = await api.post("/Auth/RefreshToken", {
                refreshToken: refresh,
            });

            setToken(response.data.accessToken);
            setRefreshToken(response.data.refreshToken);

        } catch (error) {
            logout();
        }
    };

    const contextValue = useMemo(
        () => ({
            token,
            setToken,
            setRefreshToken,
            logout,
            refreshToken,
        }),
        [token, refresh]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider;