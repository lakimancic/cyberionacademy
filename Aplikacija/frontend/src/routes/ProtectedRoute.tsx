import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useEffect } from "react";

export default function ProtectedRoute() {
    const auth = useAuth();
    const location = useLocation();

    if(!auth || !auth.token)
        return <Navigate to="/login" />;

    useEffect(() => {
        auth.checkAndRefreshToken();
    }, [location]);

    return <Outlet />;
}