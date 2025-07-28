import api from "@/lib/api";
import { useEffect, useState } from "react";

export function useProfilePicture(userId: string) {
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        let isMounted = true;

        api.get(`/User/${userId}/ProfilePicture`, { responseType: 'blob' })
            .then(resp => {
                if(isMounted) {
                    const url = URL.createObjectURL(resp.data);
                    setAvatarUrl(url);
                }
            })
            .catch(() => {

            });

            return () => {
                isMounted = false;
                if(avatarUrl) {
                    URL.revokeObjectURL(avatarUrl);
                }
            };
    }, [userId]);

    return { avatarUrl };
}