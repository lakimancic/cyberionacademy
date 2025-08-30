import { useEffect, useRef, useState } from "react";
import "./Questions.css";
import type { AnswersSave, QuestionDetails } from "./QuizTypes";
import { Checkbox, FormControlLabel, Radio } from "@mui/material";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

type Props = {
  questions: QuestionDetails[];
  quizId: number;
  timeLeft: number;
  updateQuestion: (index: number, partial: Partial<QuestionDetails>) => void;
  submitQuiz: () => void;
  initPairs?: { left: number; right: number }[];
};

const formatTime = (time: number) => {
  const secs = time % 60;
  const mins = Math.floor(time / 60) % 60;
  const hours = Math.floor(time / 3600);

  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function Questions({
  questions,
  quizId,
  timeLeft,
  updateQuestion,
  submitQuiz,
  initPairs,
}: Props) {
  const [time, setTime] = useState(timeLeft);
  const [qIndex, setQIndex] = useState(0);
  const [finish, setFinish] = useState(false);
  const leftConnectRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightConnectRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pairs, setPairs] = useState<{ left: number; right: number }[]>(
    initPairs ?? []
  );
  const [dragging, setDragging] = useState<{
    side: "left" | "right";
    index: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const question = questions[qIndex];

  const changeQuestions = questions.map((q) => {
    if (q.type < 2) return q.options?.some((o) => o.isCorrect) ?? false;
    else if (q.type === 2) return (q.pairs?.length ?? 0) > 0;
    else return (q.answer?.length ?? 0) > 0;
  });

  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
    };
    const interval = setInterval(() => {
      if (time === 0) {
        clearInterval(interval);
        return;
      } else setTime((prev) => Math.max(prev - 1, 0));
    }, 1000);

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("resize", updateRect);
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRect) return;
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!containerRect) {
        setDragging(null);
        setMousePos(null);
        return;
      }

      const targetRefs =
        dragging.side === "left"
          ? rightConnectRefs.current
          : leftConnectRefs.current;

      let matchedIndex: number | null = null;

      for (let i = 0; i < targetRefs.length; i++) {
        const el = targetRefs[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          matchedIndex = i;
          break;
        }
      }

      if (matchedIndex !== null) {
        if (dragging.side === "left") {
          if (pairs.find((p) => p.right === matchedIndex) === undefined) {
            setPairs((prev) => [
              ...prev,
              { left: dragging.index, right: matchedIndex },
            ]);
            const qPairs = question.pairs ?? [];
            const left = question.leftPairs
              ? question.leftPairs[dragging.index]
              : null;
            const right = question.rightPairs
              ? question.rightPairs[matchedIndex]
              : null;
            if (left !== null && right !== null)
              updateQuestion(qIndex, {
                pairs: [...qPairs, { ...left, ...right }],
              });
          }
        } else {
          if (pairs.find((p) => p.left === matchedIndex) === undefined) {
            setPairs((prev) => [
              ...prev,
              { left: matchedIndex, right: dragging.index },
            ]);
            const qPairs = question.pairs ?? [];
            const left = question.leftPairs
              ? question.leftPairs[matchedIndex]
              : null;
            const right = question.rightPairs
              ? question.rightPairs[dragging.index]
              : null;
            if (left !== null && right !== null)
              updateQuestion(qIndex, {
                pairs: [...qPairs, { ...left, ...right }],
              });
          }
        }
      }

      setDragging(null);
      setMousePos(null);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, containerRect]);

  useEffect(() => {
    const json = localStorage.getItem("quizSave");
    const parsed = json ? (JSON.parse(json) as AnswersSave) : {};

    let obj: any = {};
    questions.forEach((q) => {
      if (q.type < 2) {
        let optsObj: any = {};
        (q.options ?? []).forEach((p) => {
          optsObj[p.id] = {
            isCorrect: p.isCorrect,
          };
        });
        obj[q.id] = {
          options: optsObj,
        };
      } else if (q.type == 2) {
        obj[q.id] = {
          pairs: q.pairs,
        };
      } else {
        obj[q.id] = {
          answer: q.answer,
        };
      }
    });

    parsed[quizId] = obj;
    localStorage.setItem("quizSave", JSON.stringify(parsed));
  }, [qIndex]);

  useEffect(() => {
    if (time === 0) {
      submitQuiz();
    }
  }, [time]);

  const getCenter = (el: HTMLDivElement | null) => {
    if (!el || !containerRect) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  return (
    <div className="questions" ref={containerRef}>
      <div className="questions-nav">
        <h2>Quiz Navigation</h2>
        <div className="questions-grid">
          {changeQuestions.map((cq, i) => (
            <div
              key={i}
              className={`questions-item ${
                i === qIndex ? "questions-active" : ""
              }`}
              onClick={() => setQIndex(i)}
            >
              <span>{i + 1}</span>
              {cq && <div className="questions-fill"></div>}
            </div>
          ))}
        </div>
        <div className="questions-time">Time left: {formatTime(time)}</div>
        {!finish && (
          <button
            className={`questions-submit ${
              changeQuestions.every((cq) => cq) ? "questions-submit-all" : ""
            }`}
            onClick={() => setFinish(true)}
          >
            Submit
          </button>
        )}
        {finish && (
          <div className="questions-confirm">
            <p>Do you confirm submit?</p>
            <div className="questions-buttons">
              <button onClick={submitQuiz}>Yes</button>
              <button onClick={() => setFinish(false)}>No</button>
            </div>
          </div>
        )}
      </div>
      <div className="questions-content">
        <div className="questions-number">
          Question {qIndex + 1} - {question.points}pts
        </div>
        <div className="questions-text">{question.text}</div>
        {question.type < 2 && (
          <div className="questions-options">
            {question.options?.map((opt, ind) => (
              <FormControlLabel
                key={ind}
                control={
                  question.type == 0 ? (
                    <Radio
                      checked={opt.isCorrect ?? false}
                      onChange={(e) => {
                        const options = question.options?.map((o) => ({
                          ...o,
                          isCorrect: false,
                        }));
                        if (options) options[ind].isCorrect = e.target.checked;
                        updateQuestion(qIndex, { options: options });
                      }}
                    />
                  ) : (
                    <Checkbox
                      checked={opt.isCorrect ?? false}
                      onChange={(e) => {
                        const options = question.options;
                        if (options) options[ind].isCorrect = e.target.checked;
                        updateQuestion(qIndex, { options: options });
                      }}
                    />
                  )
                }
                label={opt.text}
              />
            ))}
          </div>
        )}
        {question.type === 2 && (
          <div
            className="questions-pairs"
            style={{
              gridTemplateRows: `repeat(${
                question.leftPairs?.length ?? 0
              }, auto)`,
            }}
          >
            {question.leftPairs?.map((pair, ind) => (
              <div key={ind} className="question-pair-left">
                {pair.left}
                <div
                  className="question-drag"
                  ref={(el) => {
                    leftConnectRefs.current[ind] = el;
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const center = getCenter(leftConnectRefs.current[ind]);
                    setPairs((prev) =>
                      prev.filter((pair) => pair.left !== ind)
                    );
                    if (question.pairs)
                      updateQuestion(qIndex, {
                        pairs: question.pairs.filter(
                          (p) => p.left !== pair.left
                        ),
                      });

                    if (center) {
                      setDragging({
                        side: "left",
                        index: ind,
                        startX: center.x,
                        startY: center.y,
                      });
                      setMousePos(center);
                    }
                  }}
                ></div>
              </div>
            ))}
            {question.rightPairs?.map((pair, ind) => (
              <div key={ind} className="question-pair-right">
                {pair.right}
                <div
                  className="question-drag"
                  ref={(el) => {
                    rightConnectRefs.current[ind] = el;
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const center = getCenter(rightConnectRefs.current[ind]);
                    setPairs((prev) =>
                      prev.filter((pair) => pair.right !== ind)
                    );
                    if (question.pairs)
                      updateQuestion(qIndex, {
                        pairs: question.pairs.filter(
                          (p) => p.right !== pair.right
                        ),
                      });

                    if (center) {
                      setDragging({
                        side: "right",
                        index: ind,
                        startX: center.x,
                        startY: center.y,
                      });
                      setMousePos(center);
                    }
                  }}
                ></div>
              </div>
            ))}
          </div>
        )}
        {question.type === 3 && (
          <div className="question-enter-answer">
            <input
              type="text"
              placeholder="Answer..."
              value={question.answer ?? ""}
              onChange={(e) =>
                updateQuestion(qIndex, { answer: e.target.value })
              }
            />
          </div>
        )}
        <div className="questions-pages">
          <button
            disabled={qIndex === 0}
            onClick={() => setQIndex((prev) => Math.max(prev - 1, 0))}
          >
            <FaArrowLeft /> Previous Question
          </button>

          <button
            disabled={qIndex === questions.length - 1}
            onClick={() =>
              setQIndex((prev) => Math.min(prev + 1, questions.length - 1))
            }
          >
            Next Question <FaArrowRight />
          </button>
        </div>
      </div>
      <svg className="question-drawing">
        {pairs.map(({ left, right }, i) => {
          const start = getCenter(leftConnectRefs.current[left]);
          const end = getCenter(rightConnectRefs.current[right]);

          if (!start || !end) return null;
          return (
            <line
              key={i}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="rgba(17, 59, 122, 0.8)"
              strokeWidth={"0.3rem"}
            />
          );
        })}
        {dragging && mousePos && (
          <line
            x1={dragging.startX}
            y1={dragging.startY}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="rgba(17, 59, 122, 0.8)"
            strokeWidth={"0.3rem"}
          />
        )}
      </svg>
    </div>
  );
}

export default Questions;
