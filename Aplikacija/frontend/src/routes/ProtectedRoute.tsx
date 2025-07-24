import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export default function ProtectedRoute() {
    const auth = useAuth();

    if(!auth || !auth.token)
        return <Navigate to="/login" />;

    return <Outlet />;
}