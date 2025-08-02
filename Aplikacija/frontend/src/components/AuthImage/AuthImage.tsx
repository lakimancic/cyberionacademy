import api from "@/lib/api";
import { useEffect, useState } from "react";

type Props = {
    src: string;
    element: React.ElementType<{ src: string, className?: string }>;
    className?: string;
};

function AuthImage({ src, element: Component, className } : Props) {
    const [url, setUrl] = useState<string>("");

    useEffect(() => {
        api.get(src, { responseType: 'blob' })
            .then(resp => {
                const newUrl = URL.createObjectURL(resp.data);
                setUrl(newUrl);
            })
            .catch(() => {
                setUrl("");
            });
    }, [src]);

    return <Component src={url} className={className} />
}

export default AuthImage;