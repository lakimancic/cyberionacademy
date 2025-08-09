import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FaEdit, FaExternalLinkAlt, FaPlus, FaTrashAlt } from 'react-icons/fa';
import InputField from '@/components/Auth/InputField';
import { CircularProgress, FormControlLabel, MenuItem, Select, Slider, Switch } from '@mui/material';
import difficulties from '@/utils/difficulties';
import { MdQuiz } from 'react-icons/md';
import '@/assets/css/ModCreate.css';
import { IoIosSave, IoMdArrowRoundBack } from 'react-icons/io';
import type { Quiz } from '../Quiz/QuizTypes';
import * as yup from 'yup';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuth } from '@/contexts/AuthProvider';
import { getInfoFromToken } from '@/lib/jwt';

interface LessonData {
    id?: number;
    title: string;
    description: string;
    difficulty: number;
    categoryId?: number;
    isPublic: boolean;
    quizId?: number;
    content?: string;
};

interface Category {
    name: string;
    shortForm: string;
    id: number;
};

const getColor = (val: number) => {
    if (val < 3) return 'success.main';
    if (val < 7) return 'warning.main';
    return 'error.main';
};

const getColorHex = (val: number) => {
    if (val < 3) return '#66bb6a';
    if (val < 7) return '#ffa726';
    return '#f44336';
};

const validationSchema = yup.object({
    categoryId: yup
        .number()
        .required('Category is required'),
    description: yup
        .string()
        .required('Description is required')
        .min(10, 'Description must be at least 10 characters')
        .max(300, 'Description must be at most 300 characters'),
    title: yup
        .string()
        .required('Title is required')
        .min(3, 'Title must be at least 3 characters')
        .max(30, 'Title must be at most 30 characters'),
});

function CreateLesson() {
    const params = useParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [category, setCategory] = useState<string>('');
    const [error, setError] = useState('');
    const [lesson, setLesson] = useState<LessonData>({
        title: '',
        description: '',
        difficulty: 0,
        isPublic: true
    });
    const [quiz, setQuiz] = useState<Quiz|null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const [loading, setLoading] = useState(false);
    const handleError = useErrorHandler();

    const tokenData = getInfoFromToken(auth?.token ?? null);
    
    useEffect(() => {
        api.get('/Categories/')
            .then(res => {
                setCategories(res.data);
            })
            .catch(err => console.error('Greška pri dohvatanju kategorija', err));

        if (location.state) {
            if(location.state.lesson)
                setLesson(location.state.lesson);

            if(location.state.quiz !== undefined)
                setQuiz(location.state.quiz);
        }

        if (params.id) {
            api.get(`/Lesson/GetLessonDetails/${params.id}`)
                .then(res => {
                    setLesson(res.data);
                })
                .catch(err => {
                    console.error(err);
                });
        }
    }, [location]);

    useEffect(() => {
        setCategory(categories.find((c: Category) => c.id === lesson.categoryId)?.name ?? '');
    }, [categories, lesson]);

    const createLesson = () => {
        setError("");
        setLoading(true);

        validationSchema.validate(lesson)
            .then(() => {
                api.post("/Lesson/CreateLesson", {
                    title: lesson.title,
                    description: lesson.description,
                    difficulty: lesson.difficulty,
                    public: lesson.isPublic,
                    content: lesson.content,
                    categoryId: lesson.categoryId,
                    quiz: quiz
                })
                .then(res => {
                    navigate(`/moderator/edit-lesson/${res.data}`);
                    setLoading(false);
                })
                .catch(err => {
                    setLoading(false);
                    handleError(err, setError);
                })
            })
            .catch(err => {
                setLoading(false);
                setError(err.message);
            });
    };

    const saveChanges = () => {
        setError("");
        setLoading(true);

        validationSchema.validate(lesson)
            .then(() => {
                api.put("/Lesson/UpdateLesson", {
                    id: lesson.id,
                    title: lesson.title,
                    description: lesson.description,
                    difficulty: lesson.difficulty,
                    public: lesson.isPublic,
                    content: lesson.content,
                    categoryId: lesson.categoryId,
                    quiz: quiz
                })
                .then(res => {
                    setLoading(false);
                    setLesson(prev => ({...prev, quizId: res.data !== '' ? res.data : undefined }));
                })
                .catch(err => {
                    setLoading(false);
                    handleError(err, setError);
                })
            })
            .catch(err => {
                setLoading(false);
                setError(err.message);
            });
    };

    const deleteLesson = () => {
        setLoading(true);

        api.delete("/Lesson/DeleteLesson", {
            data: {
                id: lesson.id
            }
        })
        .then(() => {
            navigate("/moderator/lessons", { state: null });
        })
        .catch(err => {
            setLoading(false);
            handleError(err, setError);
        });
    }

    const handleInputChange = (value: any, key: keyof LessonData) => {
        setLesson(prev => { return {...prev, [key]: value } });
    };

    return (
        <div className="studio-create">
            <IoMdArrowRoundBack className='studio-back' onClick={() => navigate("/moderator/lessons")}/>
            <h1>{params.id ? 'Edit' : 'Create'} Lesson</h1>
            <form className="studio-create-form">
                <h2>
                    Lesson Information
                    {params.id && <a href={`/lessons/${params.id}`} target='_blank' rel='noopener noreferrer'><FaExternalLinkAlt /></a>}
                </h2>
                {error && <div className="studio-error">{error}</div>}
                <div className="studio-create-col">
                    <InputField
                        type='text'
                        label='Title'
                        handleChange={() => {}}
                        inputProps={{
                            value: lesson.title,
                            onChange: e => handleInputChange(e.target.value, 'title')
                        }}
                    />
                    <div className="form-field studio-create-desc">
                        <div className="form-label">Description</div>
                        <textarea
                            className='form-input-normal'
                            spellCheck={false}
                            value={lesson.description}
                            onChange={e => handleInputChange(e.target.value, 'description')}
                        ></textarea>
                    </div>
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Difficulty</div>
                        <Slider
                            value={lesson.difficulty}
                            onChange={(_, val) => handleInputChange(val, 'difficulty') }
                            aria-label="Difficulty"
                            defaultValue={30}
                            getAriaValueText={val => difficulties[val]}
                            valueLabelFormat={val => difficulties[val]}
                            valueLabelDisplay="auto"
                            shiftStep={3}
                            step={1}
                            marks
                            min={0}
                            max={9}
                            sx={{
                                color: getColor(lesson.difficulty)
                            }}
                        />
                        <div 
                            className="form-value-show"
                            style={{
                                color: getColorHex(lesson.difficulty)
                            }}
                        >{difficulties[lesson.difficulty]}</div>
                    </div>
                    <div className="studio-create-switches">
                        <div className="studio-create-full form-switch-con">
                            <div className="form-label">Visibility</div>
                            <FormControlLabel control={<Switch
                                checked={lesson.isPublic}
                                onChange={e => handleInputChange(e.target.checked, 'isPublic')}
                            />} label={lesson.isPublic ? 'Public' : 'Private'} />
                        </div>
                    </div>
                    <div className="form-field">
                        <div className="form-label">Category</div>
                        <Select
                            value={category}
                            displayEmpty
                            onChange={e => {
                                setCategory(e.target.value);
                                handleInputChange(categories.find(c => c.name === e.target.value)?.id, 'categoryId');
                            }}
                            renderValue={selected => {
                                if(selected === '')
                                    return <span className='admin-placeholder'>Select Category</span>;

                                return selected;
                            }}
                            >
                                {categories.map((cat, idx) => (<MenuItem key={idx} value={cat.name}>
                                    {cat.name}
                                </MenuItem>))}
                        </Select>
                    </div>
                </div>
                <div className="studio-create-sync"></div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Lesson Content</div>
                        <div className="studio-upload-con">
                            <button type="button" onClick={() => navigate("/moderator/lesson-editor", {
                                state: { 
                                    lesson: lesson,
                                    retPage: location.pathname
                                }
                            })}><FaEdit />  Open Editor</button>
                            <p className='studio-no-upload'>{lesson.content ? `${lesson.content.split('\n').length} lines` : 'No Content'}</p>
                        </div>
                    </div>
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Quiz</div>
                        <div className="studio-upload-con">
                            <button type="button" onClick={() => {
                                if(lesson.quizId) {
                                    navigate(`/moderator/edit-quiz/${lesson.quizId}`, {
                                        state: {
                                            lesson: lesson,
                                            retPage: location.pathname
                                        }
                                    })
                                }
                                else {
                                    navigate("/moderator/new-quiz", {
                                        state: {
                                            lesson: lesson,
                                            quiz: quiz,
                                            retPage: location.pathname
                                        }
                                    });
                                }
                            }}><MdQuiz />  Quiz Maker</button>
                            <p className='studio-no-upload'>{
                                lesson.quizId ? `Quiz #${lesson.quizId}` : (
                                    quiz ? 'New Quiz' : 'No Quiz'
                                )
                            }</p>
                        </div>
                    </div>
                </div>
                <div className="studio-create-buttons">
                    {!loading && <>
                    {!params.id && <button type="button" className="studio-btn-add" onClick={createLesson}><FaPlus className='studio-icon' /> Create</button>}
                    {params.id &&
                    <>
                        <button type="button" className='studio-btn-save' onClick={saveChanges}><IoIosSave className='studio-icon' /> Save Changes</button>
                        {tokenData?.role === 'Admin' && <button type="button" className='studio-btn-del' onClick={deleteLesson}><FaTrashAlt className='studio-icon' /> Delete</button>}
                    </>}
                    </>}
                    {loading && <CircularProgress color='inherit' size="1.6rem"/>}
                </div>
            </form>
        </div>
    )
}

export default CreateLesson;