import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IoIosSave } from "react-icons/io";
import { IoTrashBinSharp } from "react-icons/io5";
import { BiExport, BiImport } from "react-icons/bi";
import "./LessonEditor.css";
import { useLocation, useNavigate } from "react-router-dom";

function LessonEditor() {
  const [value, setValue] = useState("");
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const startDragging = () => {
    isDraggingRef.current = true;
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerOffsetLeft =
      containerRef.current.getBoundingClientRect().left;
    const newWidth = e.clientX - containerOffsetLeft;

    const minWidth = 400;
    const maxWidth =
      containerRef.current.getBoundingClientRect().width - minWidth;

    if (newWidth > minWidth && newWidth < maxWidth) {
      setLeftWidth(newWidth);
    }
  };

  const returnHandle = (save: boolean) => {
    if (location.state.retPage) {
      navigate(location.state.retPage, {
        state: {
          lesson: {
            ...location.state.lesson,
            content: save
              ? value.trim().length > 0
                ? value
                : undefined
              : location.state.lesson.content,
          },
          replace: true,
        },
      });
    }
  };

  const exportFile = () => {
    const blob = new Blob([value], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "export.md";
    a.click();

    URL.revokeObjectURL(url);
  };

  const importFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setValue(text);
      }
    };
    reader.readAsText(file);
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

    if (location.state && location.state.lesson) {
      setValue(location.state.lesson.content ?? "");
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopDragging);
    };
  }, []);

  return (
    <>
      <div className="editor-con" ref={containerRef}>
        <div className="editor-left" style={{ width: leftWidth ?? 0 }}>
          <div className="editor-menu">
            <button type="button" onClick={() => returnHandle(true)}>
              <IoIosSave /> Save
            </button>
            <button type="button" onClick={() => returnHandle(false)}>
              <IoTrashBinSharp /> Discard
            </button>
            <button type="button" onClick={importFile}>
              <BiImport /> Import
            </button>
            <button type="button" onClick={exportFile}>
              <BiExport /> Export
            </button>
            <input
              type="file"
              accept=".md"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
          <div className="editor-content">
            <Editor
              defaultLanguage="markdown"
              theme="vs-dark"
              value={value}
              onChange={(val) => setValue(val ?? "")}
            />
          </div>
        </div>
        <div className="editor-divider" onMouseDown={startDragging} />
        <div className="editor-right">
          <ReactMarkdown
            children={value}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <SyntaxHighlighter
                    // @ts-ignore
                    style={atomDark}
                    children={String(children ?? "").replace(/\n$/, "")}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          />
        </div>
      </div>
    </>
  );
}

export default LessonEditor;
