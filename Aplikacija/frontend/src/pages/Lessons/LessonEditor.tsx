import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import './LessonEditor.css';

function LessonEditor() {
    const [leftWidth, setLeftWidth] = useState<number|null>(null);
    const containerRef = useRef<HTMLDivElement|null>(null);
    const isDraggingRef = useRef(false);

    const startDragging = () => {
        isDraggingRef.current = true;
    };

    const stopDragging = () => {
        isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return;

        const containerOffsetLeft = containerRef.current.getBoundingClientRect().left;
        const newWidth = e.clientX - containerOffsetLeft;
        
        const minWidth = 400;
        const maxWidth = containerRef.current.getBoundingClientRect().width - minWidth;

        if (newWidth > minWidth && newWidth < maxWidth) {
            setLeftWidth(newWidth);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && leftWidth === null) {
                const containerWidth = containerRef.current.offsetWidth;
                setLeftWidth(containerWidth / 2);
            }
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [leftWidth]);

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", stopDragging);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", stopDragging);
        };
    }, []);

    return <>
        {/* <Editor defaultLanguage="markdown" defaultValue="# Hello" theme='vs-dark' /> */}
        <div className="editor-con" ref={containerRef}>
            <div className="editor-left" style={{ width: leftWidth ?? 0 }}>
                <Editor defaultLanguage="markdown" defaultValue="# Hello" theme='vs-dark' />
            </div>
            <div className="editor-divider" onMouseDown={startDragging} />
            <div className="editor-right">
                <ReactMarkdown children={'# Hello\n## Hello\n```cs\nConsole.Write()\n```\n'}/>
            </div>
        </div>
    </>
}

export default LessonEditor;