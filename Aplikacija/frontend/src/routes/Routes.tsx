import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import ProtectedRoute from "./ProtectedRoute";
import Welcome from "@/pages/Welcome/Welcome";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import MainLayout from "@/layouts/MainLayout/MainLayout";
import Lessons from "@/pages/Lessons/Lessons";
import Challenges from "@/pages/Challenges/Challenges";
import Challenge from "@/pages/Challenges/Challenge";
import Courses from "@/pages/Courses/Courses";
import Settings from "@/pages/Settings/Settings";
import User from "@/pages/User/User";
import Profile from "@/pages/User/Profile";
import RoleSignup from "@/pages/Roles/RoleSignup";
import AdminRoles from "@/pages/Roles/AdminRoles";
import { getInfoFromToken } from "@/lib/jwt";
import Scoreboard from "@/pages/Scoreboard/Scoreboard";
import Support from "@/pages/Support/Support";
import ChallengeStudio from "@/pages/Challenges/ChallengeStudio";
import CreateChallenge from "@/pages/Challenges/CreateChallenge";
import LessonStudio from "@/pages/Lessons/LessonStudio";
import CreateLesson from "@/pages/Lessons/CreateLesson";
import LessonEditor from "@/pages/Lessons/LessonEditor";
import LessonDetails from "@/pages/Lessons/LessonDetails";

function Routes() {
    const auth = useAuth();

    const token = getInfoFromToken(auth?.token ?? null);
    const roleInd = ['User', 'Helper', 'Moderator', 'Admin'].indexOf(token?.role ?? 'User');

    const routesForPublic = [
        {
            path: "*",
            element: <Navigate to="/" replace />,
        },
    ];

    const routesForHelper = [
        {
            path: "/helper/questions",
            element: <Support isNew={false} isSupport={true} />
        }
    ];

    const routesForMod = [
        {
            path: "/moderator/challenges",
            element: <ChallengeStudio />
        },
        {
            path: "/moderator/new-challenge",
            element: <CreateChallenge />
        },
        {
            path: "/moderator/edit-challenge/:id",
            element: <CreateChallenge />
        },
        {
            path: "/moderator/lessons",
            element: <LessonStudio />
        },
        {
            path: "/moderator/new-lesson",
            element: <CreateLesson />
        },
        {
            path: "/moderator/edit-lesson/:id",
            element: <CreateLesson />
        },
        {
            path: "/moderator/lesson-editor",
            element: <LessonEditor />
        }
    ];

    const routesForAdmin = [
        {
            path: "/admin/users-roles",
            element: <AdminRoles />
        }
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
                            path: "/lessons/:id",
                            element: <LessonDetails />
                        },
                        {
                            path: "/challenges",
                            element: <Challenges />
                        },
                        {
                            path: "/challenges/:id",
                            element: <Challenge />
                        },
                        {
                            path: "/courses",
                            element: <Courses />
                        },
                        {
                            path: "/settings",
                            element: <Settings />
                        },
                        {
                            path: "/user/:userId",
                            element: <User />
                        },
                        {
                            path: "/profile",
                            element: <Profile />
                        },
                        {
                            path: '/role-signup',
                            element: <RoleSignup />
                        },
                        {
                            path: '/scoreboard',
                            element: <Scoreboard />
                        },
                        {
                            path: '/support',
                            element: <Support isNew={false} isSupport={false} />
                        },
                        {
                            path: '/new-support/:type/:id',
                            element: <Support isNew={true} isSupport={false} />
                        },
                        ...(roleInd >= 1 ? routesForHelper : []),
                        ...(roleInd >= 2 ? routesForMod : []),
                        ...(roleInd >= 3 ? routesForAdmin : [])
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