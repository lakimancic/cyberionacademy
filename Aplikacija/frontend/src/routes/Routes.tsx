import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import ProtectedRoute from "./ProtectedRoute";
import Welcome from "@/pages/Welcome/Welcome";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import MainLayout from "@/layouts/MainLayout/MainLayout";
import Lessons from "@/pages/Lessons/Lessons";
import Challenges from "@/pages/Challenges/Challenges";
import Courses from "@/pages/Courses/Courses";
import Settings from "@/pages/Settings/Settings";

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
                    element: <MainLayout />,
                    children: [
                        {
                            path: "/",
                            element: <div>HELLO WORLD</div> 
                        },
                        {
                            path: "/lessons",
                            element: <Lessons />
                        },
                        {
                            path: "/challenges",
                            element: <Challenges />
                        },
                        {
                            path: "/courses",
                            element: <Courses />
                        },
                        {
                            path: "/settings",
                            element: <Settings />
                        }
                    ]
                },
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
        ...(!auth?.token ? routesForNotAuthenticatedOnly : []),
        ...routesForAuthenticatedOnly,
        ...routesForPublic
    ]);

    return <RouterProvider router={router} />;
}

export default Routes;