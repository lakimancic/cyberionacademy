import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function AutoGrowTextarea({ value, onChange, ...props } : Props) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [value]);

    return (
        <textarea 
            ref={textareaRef}
            value={value}
            onChange={onChange}
            rows={1}
            {...props}
        />
    )
}

export default AutoGrowTextarea;