import { jwtDecode } from "jwt-decode";

type JwtPayload = {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string;
    "exp": number;
}

export function getInfoFromToken(token: string | null) {
    if(!token)
        return null;
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        return {
            username: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            userId: parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]),
            role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            exp: decoded["exp"],
        }
    }
    catch(err) {
        return null;
    }
}