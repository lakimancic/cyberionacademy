import { useAuth } from "@/contexts/AuthProvider";
import { getInfoFromToken } from "@/lib/jwt";
import { Navigate } from "react-router-dom";

function Profile() {
  const auth = useAuth();
  const token = getInfoFromToken(auth?.token ?? null);

  return <Navigate to={`/user/${token?.userId ?? 0}`} />;
}

export default Profile;
