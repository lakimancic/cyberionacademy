// import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Quiz.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import categories from '@/utils/categories';
import difficulties from '@/utils/difficulties';
import PlayArrowTwoToneIcon from '@mui/icons-material/PlayArrowTwoTone';
import AuthImage from '@/components/AuthImage/AuthImage';
import { Avatar } from '@mui/material';
import type { AnswersSave, QuestionDetails } from './QuizTypes';
import Questions from './Questions';
import api from '@/lib/api';

interface QuizDetails {
    id: number;
    lessonId: number;
    title: string;
    category: {
        id: number;
        name: string;
        shortForm: string;
    },
    difficulty: number;
    createdAt: string;
    authorId: number;
    authorName: string;
    totalPoints: number;
    questionCount: number;
    time: number;
    cooldown?: number;
    doingNow: boolean;
    results: {
        points: number;
        startedAt: string;
        finishedAt?: string;
    }[]
};

const getGrade = (points: number) => {
    if (points >= 90) return 'A';
    else if (points >= 80) return 'B';
    else if (points >= 70) return 'C';
    else if (points >= 60) return 'D';
    else return 'F';
};

function Quiz() {
    const params = useParams();
    const [quiz, setQuiz] = useState<QuizDetails|null>(null);
    const [questions, setQuestions] = useState<QuestionDetails[]>([]);
    const [initPairs, setInitPairs] = useState<{ left: number; right: number}[]>([]);
    const navigate = useNavigate();

    const loadAnswers = (arr : QuestionDetails[]) => {
        const json = localStorage.getItem("quizSave");
        const parsed = json ? JSON.parse(json) as AnswersSave : {}; 

        const quizSave = parsed[parseInt(params?.id ?? '-1')];
        if(quizSave) {
            return arr.map(q => {
                if (q.id in quizSave) {
                    if (q.type < 2) {
                        q.options = q.options?.map(o => ({...o, isCorrect: quizSave[q.id]?.options?.[o.id].isCorrect ?? false }))
                    }
                    else if (q.type === 2) {
                        q.pairs = quizSave[q.id]?.pairs;
                        setInitPairs(q.pairs ? q.pairs.map(p => {
                            return { 
                                left: q.leftPairs?.findIndex(pp => pp.left === p.left) ?? -1, 
                                right: q.rightPairs?.findIndex(pp => pp.right === p.right) ?? -1
                            }
                        }).filter(p => p.left != -1 && p.right != -1) : []);
                    }
                    else {
                        q.answer = quizSave[q.id]?.answer ?? undefined;
                    }
                }
                return q;
            })
        }
        return arr;
    };

    const fetchQuiz = () => {
        api.get("/Quiz/QuizDetails", { params: { id: params.id } })
            .then(res => {
                setQuiz(res.data);

                if (res.data.doingNow) {
                    api.get("/Quiz/Continue", { params: { id: res.data.id }})
                        .then(resp => {
                            setQuestions(loadAnswers(resp.data.questions));
                            setQuiz(prev => prev ? ({...prev, time: resp.data.time }) : prev);
                        })
                        .catch(err => console.error(err));
                }
                else {
                    const json = localStorage.getItem("quizSave");
                    const parsed = json ? JSON.parse(json) as AnswersSave : {}; 

                    delete parsed[parseInt(params.id ?? '-1')];
                    localStorage.setItem("quizSave", JSON.stringify(parsed));
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    const startQuiz = () => {
        api.post("/Quiz/Start", {
            id: quiz?.id
        })
            .then(res => {
                setQuestions(res.data);
            });
    };

    const submitQuiz = () => {
        api.put("/Quiz/Submit", {
            id: quiz?.id,
            questions: questions
        })
        .then(() => {
            setQuestions([]);
            fetchQuiz();
        })
        .catch(err => {
            console.error(err);
        })
    };

    useEffect(() => {
        if(!params.id)
            navigate("/lessons");
            
        fetchQuiz();
    }, []);

    const updateQuestionPartial = (
        index: number,
        partial: Partial<QuestionDetails>
    ) => {
        setQuestions(prev =>
            prev.map((q, i) => (i === index ? { ...q, ...partial } : q))
        );
    };

    if (!quiz)
        return <></>

    if (questions.length > 0)
        return <Questions 
            questions={questions} 
            quizId={quiz.id} 
            timeLeft={quiz.time} 
            updateQuestion={updateQuestionPartial} 
            submitQuiz={submitQuiz} 
            initPairs={initPairs}
        />

    return (
        <div className="quiz-con">
            <div className="quiz-header">
                <div className="quiz-left">
                    <img src={(categories as any)[quiz.category.shortForm]} />
                    <div className="quiz-title">
                        <h1>Quiz for: <Link to={`/lesson/${quiz.lessonId}`}>{quiz.title}</Link></h1>
                        <h2>{quiz.category.name}</h2>
                    </div>
                </div>
                <div className="quiz-right">
                    <div className="meta-card">
                        <p className="meta-label">📅 Created</p>
                        <p>{new Date(quiz.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}</p>
                    </div>
                    <div className="meta-card">
                        <p className="meta-label">⏰ Time</p>
                        <p>{Math.floor(quiz.time / 60)} min</p>
                    </div>
                    <div className="meta-card">
                        <p className="meta-label">🎯 Points</p>
                        <p>{quiz.totalPoints}</p>
                    </div>
                    <div className="meta-card">
                        <p className="meta-label">🧠 Difficulty</p>
                        <p>{difficulties[quiz.difficulty]}</p>
                    </div>
                </div>
            </div>
            <div className="quiz-content">
                <div className="quiz-sidebar">
                    <div className="quiz-actions-section">
                        <div 
                            className={`action-item ${quiz.cooldown ? 'disabled-action' : ''}`}
                            style={{ pointerEvents: quiz.cooldown ? "none" : "auto" }}
                            onClick={startQuiz}
                        >
                            <div className="icon-container">
                                <PlayArrowTwoToneIcon fontSize="large" />
                            </div>
                            <div className="action-text">
                                <p className="subtitle bold">Start Quiz</p>
                                <p className="action-description">{quiz.cooldown ? `You can start quiz in ${quiz.cooldown} days` : 'Quiz starts immediately'}</p>
                        </div>
                        </div>
                    </div>
                    <Link
                        to={`/user/${quiz.authorId}`}
                        className="author-card meta-card clickable-card"
                    >
                        <h3>Author</h3>
                        <div className="author-info">
                        <AuthImage src={`/User/${quiz.authorId}/ProfilePicture`} element={Avatar} />
                        <div className="author-details">
                            <p className="author-name">{quiz.authorName}</p>
                        </div>
                        </div>
                    </Link>
                </div>
                <div className="quiz-details">
                    <h1>Quiz Attempts</h1>
                    <h2>You can attempt to solve quiz once in 30 days</h2>
                    {quiz.results.map((result, ind) => (
                        <div className="quiz-attempt" key={ind}>
                            <div className="quiz-time-at">
                                <p>Started at:</p>
                                <strong>{new Date(result.startedAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}</strong>
                            </div>
                            <div className="quiz-time-at">
                                <p>Finished at:</p>
                                <strong>{result.finishedAt ? new Date(result.finishedAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                }) : 'Not finished'}</strong>
                            </div>
                            <div className="quiz-attempt-points">
                                <p>Points:</p>
                                <strong>{result.points} / {quiz.totalPoints}</strong>
                            </div>
                            <div className={`quiz-grade quiz-${getGrade(result.points * 100 / quiz.totalPoints)}`}>
                                {getGrade(result.points * 100 / quiz.totalPoints)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Quiz;