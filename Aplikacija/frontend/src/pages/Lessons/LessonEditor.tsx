import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { IoIosSave } from 'react-icons/io';
import { IoTrashBinSharp } from 'react-icons/io5';
import { BiExport, BiImport } from "react-icons/bi";
import './LessonEditor.css';


function LessonEditor() {
    const [value, setValue] = useState("");
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
        <div className="editor-con" ref={containerRef}>
            <div className="editor-left" style={{ width: leftWidth ?? 0 }}>
                <div className="editor-menu">
                    <button type="button"><IoIosSave /> Save</button>
                    <button type="button"><IoTrashBinSharp /> Discard</button>
                    <button type="button"><BiImport /> Import</button>
                    <button type="button"><BiExport /> Export</button>
                </div>
                <div className="editor-content">
                    <Editor 
                        defaultLanguage="markdown" 
                        theme='vs-dark'
                        value={value}
                        onChange={val => setValue(val ?? '')}
                    />
                </div>
            </div>
            <div className="editor-divider" onMouseDown={startDragging} />
            <div className="editor-right">
                <ReactMarkdown
                    children={value}
                    components={{
                        code({node, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                                <SyntaxHighlighter
                                    // @ts-ignore
                                    style={atomDark}
                                    children={String(children ?? '').replace(/\n$/, '')}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                />
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        }
                        }}
                />
            </div>
        </div>
    </>
}

export default LessonEditor;