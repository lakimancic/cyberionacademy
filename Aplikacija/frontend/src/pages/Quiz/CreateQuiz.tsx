import { useLocation, useNavigate, useParams } from 'react-router-dom';
import InputField from '@/components/Auth/InputField';
import { Checkbox, MenuItem, Radio, Select, Slider } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';
import { FaMinusCircle, FaPlus, FaPlusCircle, FaTrashAlt } from 'react-icons/fa';
import { IoIosSave } from 'react-icons/io';
import React from 'react';
import '@/assets/css/ModCreate.css';
import type { AnswerOption, ConnectPair, Question, Quiz } from './QuizTypes';
import * as yup from 'yup';
import api from '@/lib/api';
import { useNotification } from '@/contexts/Notification/NotificationProvider';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const questionTypes = ['Single Answer', 'Multiple Answer', 'Connect Pairs', 'Text Answer'];
const typesLabel = ['Select correct one', 'Select correct ones', 'Write matching pairs', 'Keep answer short'];

const quizSchema = yup.object({
    timeMinutes: yup
        .number()
        .required("Time in minutes is required")
        .integer("Time in minutes must be integer")
        .min(5, "Minimum time is 5 minutes")
        .max(120, "Maximum time is 120 minutes"),
    questionCount: yup
        .number()
        .required("Question count is required")
        .integer("Question count must be integer")
});

const questionSchema = yup.object({
    text: yup
        .string()
        .required("Question Text is required")
        .min(10, "Question Text must be at least 10 characters")
        .max(300, "Question Text must be at most 300 characters")
});

const ansOptionSchema = yup.object({
    text: yup
        .string()
        .required("Answer Text is required")
        .required("Answer Text must be at most 30 characters")
});

const pairSchema = yup.object({
    right: yup
        .string()
        .required("Pair Text is required")
        .required("Pair Text must be at most 30 characters"),
    left: yup
        .string()
        .required("Pair Text is required")
        .required("Pair Text must be at most 30 characters"),
});

function CreateQuiz() {
    const params = useParams();
    const [quiz, setQuiz] = useState<Quiz>({
        questionCount: 0,
        timeMinutes: 5,
        questions: []
    });
    const selectRef = useRef<any>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [globalError, setGlobalError] = useState("");
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement|null>(null);
    const [questionErrors, setQuestionErrors] = useState<string[]>([]);
    const { showNotification } = useNotification();
    const handleError = useErrorHandler();

    const addQuestion = (type: number) => {
        const newQuestion: Question = {
            text: "Question is...",
            points: 5,
            type: type,
            answers: type !== 2 ? [
                { text: type === 3 ? 'Answer' : 'Option 1', isCorrect: true },
                ...(type !== 3 ? [{ text: 'Option 2', isCorrect: false }] : [])
            ] : undefined,
            pairs: type === 2 ? [
                { left: 'Left 1', right: 'Right 1' },
                { left: 'Left 2', right: 'Right 2' }
            ] : undefined,
        };

        setQuiz(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
        setQuestionErrors(prev => [...prev, ""]);
    };

    const removeQuestion = (qIndex: number) => {
        setQuiz(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== qIndex)
        }));
        setQuestionErrors(prev => prev.filter((_, i) => i !== qIndex));
    };

    const addOption = (qIndex: number) => {
        const questions = quiz.questions;
        const newOption: AnswerOption = {
            text: 'New option',
            isCorrect: false
        };
        if (questions[qIndex].answers) {
            if (questions[qIndex].answers.length === 8) return;

            questions[qIndex].answers.push(newOption);
        }
        
        setQuiz(prev => ({
            ...prev,
            questions: questions
        }));
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const questions = quiz.questions;

        if (questions[qIndex].answers) {
            if(questions[qIndex].answers.length == 2)
                return;
            questions[qIndex].answers.splice(oIndex, 1);
        }

        setQuiz(prev => ({
            ...prev,
            questions: questions
        }));
    };

    const addPair = (qIndex: number) => {
        const questions = quiz.questions;
        const newPair: ConnectPair = {
            left: 'New Left',
            right: 'New Right'
        };
        if (questions[qIndex].pairs) {
            if (questions[qIndex].pairs.length === 8) return;

            questions[qIndex].pairs.push(newPair);
        }
        
        setQuiz(prev => ({
            ...prev,
            questions: questions
        }));
    };

    const removePair = (qIndex: number, pIndex: number) => {
        const questions = quiz.questions;

        if (questions[qIndex].pairs) {
            if(questions[qIndex].pairs.length == 2)
                return;
            questions[qIndex].pairs.splice(pIndex, 1);
        }

        setQuiz(prev => ({
            ...prev,
            questions: questions
        }));
    };

    const deleteQuiz = () => {
        if(params.id) {
            api.delete("/Quiz/DeleteQuiz", {
                data: { id: quiz.id }
            })
            .then(() => {
                navigate(location.state.retPage, { state: {
                    lesson: location.state.lesson
                }, replace: true })
            })
            .catch(err => {
                if (err.response.status == 404)
                    navigate(location.state.retPage, { state: {
                        lesson: location.state.lesson
                    }, replace: true })
                else
                    handleError(err, msg => showNotification(msg, 'error'));
            })
        }
        else {
            navigate(location.state.retPage, { state: {
                quiz: null,
                lesson: location.state.lesson
            }, replace: true })
        }
    };

    const createQuiz = async () => {
        if(!(await validateQuiz()))
            return;

        navigate(location.state.retPage, { state: {
            quiz: quiz,
            lesson: location.state.lesson
        }, replace: true })
    };

    const saveChanges = async () => {
        if(!(await validateQuiz()))
            return;

        api.put("/Quiz/UpdateQuiz", quiz)
            .then(() => {
                showNotification("Quiz updated successfully", "success");
                navigate(location.state.retPage, { state: {
                    lesson: location.state.lesson
                }, replace: true });
            })
            .catch(err => {
                handleError(err, msg => showNotification(msg, 'error'));
            });
    };

    const validateQuiz = async () => {
        setGlobalError("");
        setQuestionErrors(prev => prev.map(_ => ""));

        try {
            await quizSchema.validate(quiz);
        }
        catch(err : any) {
            containerRef.current?.scrollIntoView({
                block: 'start',
                behavior: 'smooth'
            });
            setGlobalError(err.message);
            return false;
        }

        if (quiz.questions.length === 0) {
            containerRef.current?.scrollIntoView({
                block: 'start',
                behavior: 'smooth'
            });
            setGlobalError("You must have at least one question");
            return false;
        }
        if (quiz.questionCount < Math.round(quiz.questions.length / 2) ||
            quiz.questionCount > quiz.questions.length)
        {
            containerRef.current?.scrollIntoView({
                block: 'start',
                behavior: 'smooth'
            });
            setGlobalError(`Question Count must be between ${Math.round(quiz.questions.length / 2)} and ${quiz.questions.length}`);
            return false;
        }

        const qErrs = questionErrors;
        for(let i = 0; i < quiz.questions.length; i++) 
        {
            const question = quiz.questions[i];
            try {
                await questionSchema.validate(question);
            }
            catch(err : any) {
                qErrs[i] = err.message;
                setQuestionErrors(qErrs);

                questionRefs.current[i]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                return false;
            }
            
            let checked = 0;
            for(const ansOpt of question.answers ?? []) {
                try {
                    await ansOptionSchema.validate(ansOpt);
                }
                catch(err : any) {
                    qErrs[i] = err.message;
                    setQuestionErrors(qErrs);

                    questionRefs.current[i]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    return false;
                }
                checked += ansOpt.isCorrect ? 1 : 0;
            }

            for(const pair of question.pairs ?? []) {
                try {
                    await pairSchema.validate(pair);
                }
                catch(err : any) {
                    qErrs[i] = err.message;
                    setQuestionErrors(qErrs);

                    questionRefs.current[i]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    return false;
                }
            }

            if(question.type === 0 && checked !== 1) {
                qErrs[i] = "One answer must be checked";
                setQuestionErrors(qErrs);

                questionRefs.current[i]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                return false;
            }

            if(question.type === 0 && checked < 1) {
                qErrs[i] = "At least one answer must be checked";
                setQuestionErrors(qErrs);

                questionRefs.current[i]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                return false;
            }
        }

        return true;
    };

    useEffect(() => {
        if (params.id) {
            api.get("/Quiz/ModQuiz", { params: { quizId: params.id }})
                .then(res => {
                    setQuiz(res.data);
                })
                .catch(err => {
                    if (err.response.status == 404)
                        navigate(location.state.retPage, { state: {
                            lesson: location.state.lesson
                        }, replace: true });
                    else
                        handleError(err, msg => showNotification(msg, 'error'));
                })
        }

        if(location.state && location.state.quiz) {
            setQuiz(location.state.quiz);
        }
    }, [location]);
    
    return (
        <div className="studio-create" ref={containerRef}>
            <h1>{params.id ? 'Edit' : 'Create'} Quiz</h1>
            <form className="studio-create-form studio-form-quiz">
                <h2>
                    Quiz Information
                </h2>
                {globalError && <div className="studio-error">{globalError}</div>}
                <div className="studio-create-col">
                    <InputField
                        type='number'
                        label='Questions Count in Quiz'
                        handleChange={() => {}}
                        inputProps={{
                            min: Math.round(quiz.questions.length / 2),
                            max: quiz.questions.length,
                            step: 1,
                            value: quiz.questionCount.toString(),
                            onChange: e => setQuiz(prev => ({
                                ...prev,
                                questionCount: parseInt(e.target.value) || 0
                            }))
                        }}
                        setNumberValue={val => setQuiz(prev => ({
                            ...prev,
                            questionCount: val
                        }))}
                    />
                </div>
                <div className="studio-create-col">
                    <InputField
                        type='number'
                        label='Time in minutes'
                        handleChange={() => {}}
                        inputProps={{
                            min: 5,
                            max: 120,
                            step: 1,
                            value: quiz.timeMinutes.toString(),
                            onChange: e => setQuiz(prev => ({
                                ...prev,
                                timeMinutes: parseInt(e.target.value) || 0
                            }))
                        }}
                        setNumberValue={val => setQuiz(prev => ({
                            ...prev,
                            timeMinutes: val
                        }))}
                    />
                </div>
            </form>
            <h2>Questions</h2>
            {quiz.questions.map((question, qIndex) => (
                <div className="studio-quiz-quest" key={`q-${qIndex}`} ref={el => { questionRefs.current[qIndex] = el }}>
                    <div className="studio-quiz-delete-con">
                        <MdDelete onClick={() => removeQuestion(qIndex) } />
                    </div>
                    {questionErrors[qIndex] && <div className="studio-error">{questionErrors[qIndex]}</div>}
                    <div className="form-field">
                        <div className="form-label">Question Text</div>
                        <textarea
                            className='form-input-normal'
                            value={question.text}
                            onChange={e => {
                                const questions = quiz.questions;
                                questions[qIndex].text = e.target.value;
                                setQuiz(prev => ({...prev, questions: questions}));
                            }}
                            spellCheck={false}
                        ></textarea>
                    </div>
                    <div className="form-field">
                        <div className="form-label">Answers ({typesLabel[question.type]})</div>
                        {question.type < 3 && <div className="studio-answer-grid">
                            {question.type !== 2 && question.answers?.map((option, oIndex) => {
                                return (
                                     <React.Fragment key={`q-${oIndex}`}>
                                        <div className="studio-quiz-answer">
                                            <input 
                                                type="text" 
                                                className='studio-single-answer form-input-normal'
                                                value={option.text}
                                                onChange={oe => {
                                                    const questions = quiz.questions;
                                                    if(questions[qIndex].answers)
                                                        questions[qIndex].answers[oIndex].text = oe.target.value;
                                                    setQuiz(prev => ({...prev, questions: questions}));
                                                }}
                                            />
                                            {question.type === 0 && <Radio
                                                name="radio-buttons"
                                                checked={option.isCorrect}
                                                onChange={oe => {
                                                    const questions = quiz.questions;
                                                    if(questions[qIndex].answers) {
                                                        questions[qIndex].answers.forEach(op => op.isCorrect = false);
                                                        questions[qIndex].answers[oIndex].isCorrect = oe.target.checked;
                                                    }
                                                    setQuiz(prev => ({...prev, questions: questions}));
                                                }}
                                            />}
                                            {question.type === 1 && <Checkbox
                                                name="radio-buttons"
                                                checked={option.isCorrect}
                                                onChange={oe => {
                                                    const questions = quiz.questions;
                                                    if(questions[qIndex].answers) {
                                                        questions[qIndex].answers[oIndex].isCorrect = oe.target.checked;
                                                    }
                                                    setQuiz(prev => ({...prev, questions: questions}));
                                                }}
                                            />}
                                        </div>
                                        <div className={`studio-quiz-remove ${question.answers?.length == 2 ? 'studio-quiz-disabled' : ''}`}>
                                            <FaMinusCircle onClick={() => removeOption(qIndex, oIndex)} />
                                        </div>
                                    </React.Fragment>
                                )
                            })}
                            {question.type === 2 && question.pairs?.map((pair, pIndex) => {
                                return (
                                    <React.Fragment key={`q-${pIndex}`}>
                                        <div className="studio-quiz-answer">
                                            <input 
                                                type="text"
                                                className='form-input-normal'
                                                value={pair.left}
                                                onChange={pe => {
                                                    const questions = quiz.questions;
                                                    if(questions[qIndex].pairs)
                                                        questions[qIndex].pairs[pIndex].left = pe.target.value;
                                                    setQuiz(prev => ({...prev, questions: questions}));
                                                }}
                                            />
                                            <input 
                                                type="text"
                                                className='form-input-normal'
                                                value={pair.right}
                                                onChange={pe => {
                                                    const questions = quiz.questions;
                                                    if(questions[qIndex].pairs)
                                                        questions[qIndex].pairs[pIndex].right = pe.target.value;
                                                    setQuiz(prev => ({...prev, questions: questions}));
                                                }}
                                            />
                                        </div>
                                        <div className={`studio-quiz-remove ${question.pairs?.length == 2 ? 'studio-quiz-disabled' : ''}`}>
                                            <FaMinusCircle onClick={() => removePair(qIndex, pIndex)} />
                                        </div>
                                    </React.Fragment>
                                )
                            })}
                            <div className="studio-quiz-empty"></div>
                            <div className="studio-quiz-add" onClick={() => {
                                if(question.type !== 2)
                                    addOption(qIndex);
                                else
                                    addPair(qIndex);
                            }}>
                                <FaPlusCircle />
                            </div>
                        </div>}
                        {question.type === 3 &&
                            <input 
                                type="text" 
                                className='form-input-normal'
                                value={question.answers![0].text}
                                onChange={e => {
                                    const questions = quiz.questions;
                                    question.answers![0].text = e.target.value;
                                    setQuiz(prev => ({...prev, questions: questions}));
                                }}
                            />}
                    </div>
                    <div className="form-field studio-points-slider">
                        <div className="form-label">Points</div>
                        <Slider
                            value={question.points}
                            onChange={(_, val) => {
                                const questions = quiz.questions;
                                questions[qIndex].points = val;
                                setQuiz(prev => ({...prev, questions: questions}));
                            }}
                            aria-label="Points"
                            defaultValue={0}
                            valueLabelDisplay="auto"
                            shiftStep={15}
                            step={5}
                            marks
                            min={5}
                            max={30}
                        />
                        <div className="form-value-show">{question.points}pts</div>
                    </div>
                </div>
            ))}
            <div className="studio-add-quiz">
                <Select
                    className='studio-select-type'
                    value={''}
                    displayEmpty
                    ref={selectRef}
                    onChange={e => addQuestion(parseInt(e.target.value))}
                    IconComponent={() => <FiPlus />}
                    renderValue={selected => {
                        if(selected.length === 0)
                            return 'Add Question';

                        return selected;
                    }}
                    >
                        {questionTypes.map((type, idx) => (<MenuItem key={idx} value={idx}>
                            {type}
                        </MenuItem>))}
                </Select>
            </div>
            <div className="studio-create-buttons">
                {!params.id && <>
                    <button type="button" className='studio-btn-add' onClick={createQuiz}><FaPlus /> Create</button>
                </>}
                {params.id && <>
                    <button type="button" className='studio-btn-save' onClick={saveChanges}><IoIosSave /> Save Changes</button>
                </>}
                <button type="button" className='studio-btn-del' onClick={deleteQuiz}><FaTrashAlt  /> Delete</button>
            </div>
        </div>
    )
}

export default CreateQuiz;