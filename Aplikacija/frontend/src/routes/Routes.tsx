import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import ProtectedRoute from "./ProtectedRoute";
import Welcome from "@/pages/Welcome/Welcome";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";

function Routes() {
    const auth = useAuth();

    const routesForPublic = [
        {
            path: "*",
            element: <Navigate to="/" replace />,
        },
    ];

    const routesForAuthenticatedOnly = [
        {
            path: "/",
            element: <ProtectedRoute />,
            children: [
                {
                    path: "/",
                    element: <div>Hello World</div>,
                }
            ]
        }
    ];

    const routesForNotAuthenticatedOnly = [
        {
            path: "/",
            element: <Welcome />
        },
        {
            path: "/login",
            element: <Login />
        },
        {
            path: "/register",
            element: <Register />
        }
    ];

    const router = createBrowserRouter([
        ...(!auth || !auth.token ? routesForNotAuthenticatedOnly : []),
        ...routesForAuthenticatedOnly,
        ...routesForPublic
    ]);

    return <RouterProvider router={router} />;
}

export default Routes;