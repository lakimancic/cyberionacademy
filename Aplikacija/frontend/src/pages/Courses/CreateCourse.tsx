import '@/assets/css/ModCreate.css';
import InputField from '@/components/Auth/InputField';
import AuthImage from '@/components/AuthImage/AuthImage';
import SearchBar from '@/components/SearchBar/SearchBar';
import { useAuth } from '@/contexts/AuthProvider';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { getInfoFromToken } from '@/lib/jwt';
import difficulties from '@/utils/difficulties';
import categories from '@/utils/categories';
import { CircularProgress, Slider } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { FaAngleDoubleRight, FaPlus, FaTrashAlt } from 'react-icons/fa';
import { IoIosSave } from 'react-icons/io';
import { MdCloudUpload, MdDelete } from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaRegCircleDown, FaRegCircleUp, FaRegCircleXmark } from 'react-icons/fa6';
import api from '@/lib/api';
import * as yup from 'yup';

interface CourseData {
    id?: number;
    title: string;
    difficulty: number;
    description: string;
    hasBanner: boolean;
    items: CourseItem[];
};

interface CourseItem {
    id: number;
    name: string;
    categoryName: string;
    categoryShort: string;
    difficulty: number;
    type: number;
};

interface ChallengeItem {
    id: number;
    name: string;
    category: {
        name: string;
        shortForm: string;
    },
    difficulty: number;
};

interface LessonItem {
    id: number;
    title: string;
    category: {
        name: string;
        shortForm: string;
    },
    difficulty: number;
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

type ImageWrapperProps = React.ImgHTMLAttributes<HTMLImageElement>;

const ImageWrapper: React.FC<ImageWrapperProps> = ({ src, alt = '', ...props }) => {
    return <img src={src===""?undefined:src} alt={alt} {...props} />;
};

const validationSchema = yup.object({
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

function CreateCourse() {
    const params = useParams();
    const bannerFileRef = useRef<HTMLInputElement | null>(null);
    const [course, setCourse] = useState<CourseData>({
        title: '',
        description: '',
        hasBanner: false,
        difficulty: 0,
        items: []
    });
    const auth = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const handleError = useErrorHandler();
    const [error, setError] = useState('');
    const [searchChallenge, setSearchChallenge] = useState('');
    const [searchLesson, setSearchLesson] = useState('');
    const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
    const [lessons, setLessons] = useState<LessonItem[]>([]);
    const [currentItem, setCurrentItem] = useState<number|null>(null);
    const [currentType, setCurrentType] = useState<'challenge'|'lesson'|null>(null);
    const [currentMyItem, setCurrentMyItem] = useState<number|null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [triggerFetch, setTriggerFetch] = useState(false);

    const tokenData = getInfoFromToken(auth?.token ?? null);

    const handleInputChange = (value: any, key: keyof CourseData) => {
        setCourse(prev => { return {...prev, [key]: value } });
    };

    const fetchChallenges = () => {
        api.get("/Challenge/Search", {
            params: { search: searchChallenge, exclude: course.items.filter(i => i.type === 0).map(i => i.id) }
        })
        .then(res => {
            if (currentType === 'challenge') {
                setCurrentType(null);
                setCurrentItem(null);
            }
            setChallenges(res.data);
        })
        .catch(err => {
            console.error(err);
        })
    };

    const fetchLessons = () => {
        api.get("/Lesson/Search", {
            params: { search: searchLesson, exclude: course.items.filter(i => i.type === 1).map(i => i.id) }
        })
        .then(res => {
            if (currentType === 'lesson') {
                setCurrentType(null);
                setCurrentItem(null);
            }
            setLessons(res.data);
        })
        .catch(err => {
            console.error(err);
        })
    };

    const insertAt = (array : CourseItem[], index : number, item: CourseItem) => {
        return [
            ...array.slice(0, index),
            item,
            ...array.slice(index)
        ];
    };

    const addItemToList = () => {
        if (currentItem !== null && currentType) {
            if (currentType == 'challenge') {
                const currentChallege = challenges[currentItem];
                const newItem = {
                    id: currentChallege.id,
                    name: currentChallege.name,
                    categoryName: currentChallege.category.name,
                    categoryShort: currentChallege.category.shortForm,
                    difficulty: currentChallege.difficulty,
                    type: 0
                };

                setCourse(prev => ({
                    ...prev,
                    items: insertAt(prev.items, currentMyItem ?? prev.items.length, newItem)
                }));
                setChallenges(prev => prev.filter((_, i) => i !== currentItem));
                setCurrentItem(null);
                setCurrentType(null);
            }
            else if (currentType == 'lesson') {
                const currentLesson = lessons[currentItem];
                const newItem = {
                    id: currentLesson.id,
                    name: currentLesson.title,
                    categoryName: currentLesson.category.name,
                    categoryShort: currentLesson.category.shortForm,
                    difficulty: currentLesson.difficulty,
                    type: 1
                };

                setCourse(prev => ({
                    ...prev,
                    items: insertAt(prev.items, currentMyItem ? (currentMyItem + 1) : prev.items.length, newItem)
                }))
                setLessons(prev => prev.filter((_, i) => i !== currentItem));
                setCurrentItem(null);
                setCurrentType(null);
            }
        }
    };

    const createCourse = () => {
        setError("");
        setLoading(true);

        validationSchema.validate(course)
        .then(() => {
            const formData = new FormData();
            formData.append("Title", course.title);
            formData.append("Description", course.description);
            formData.append("Difficulty", course.difficulty.toString());

            if (preview && bannerFileRef.current?.files && bannerFileRef.current.files.length > 0)
                formData.append("Banner", bannerFileRef.current.files[0]);

            if (course.items.length < 5) {
                setError("Course must have at least 5 items");
                setLoading(false);
                return;
            }

            if (course.items.length > 50) {
                setError("Course must have at most 50 items");
                setLoading(false);
                return;
            }

            course.items.forEach((item, index) => {
                formData.append(`Items[${index}].Id`, item.id.toString());
                formData.append(`Items[${index}].Type`, item.type.toString());
            });

            api.post("/Course/CreateCourse", formData)
                .then(resp => {
                    navigate(`/moderator/edit-course/${resp.data}`);
                })
                .catch(err => {
                    handleError(err, setError);
                })
                .finally(() => setLoading(false));
        })
        .catch(err => {
            handleError(err, setError);
        })
        .finally(() => setLoading(false));
    };

    const updateCourse = () => {
        setError("");
        setLoading(true);

        validationSchema.validate(course)
        .then(() => {
            const formData = new FormData();
            formData.append("Id", course.id ? course.id.toString() : '-1');
            formData.append("Title", course.title);
            formData.append("Description", course.description);
            formData.append("Difficulty", course.difficulty.toString());

            if (preview && bannerFileRef.current?.files && bannerFileRef.current.files.length > 0)
                formData.append("Banner", bannerFileRef.current.files[0]);
            else if (!course.hasBanner)
                formData.append("DeleteBanner", "true");

            if (course.items.length < 5) {
                setError("Course must have at least 5 items");
                setLoading(false);
                return;
            }

            if (course.items.length > 50) {
                setError("Course must have at most 50 items");
                setLoading(false);
                return;
            }

            course.items.forEach((item, index) => {
                formData.append(`Items[${index}].Id`, item.id.toString());
                formData.append(`Items[${index}].Type`, item.type.toString());
            });

            api.put("/Course/UpdateCourse", formData)
                .then(() => {})
                .catch(err => {
                    console.error(err)
                    handleError(err, setError);
                })
                .finally(() => setLoading(false));
        })
        .catch(err => {
            handleError(err, setError);
        })
        .finally(() => setLoading(false));
    };

    const deleteCourse = () => {
        api.delete("/Course/DeleteCourse", {
            data: {
                id: course.id
            }
        })
        .then(() => {
            navigate("/moderator/courses");
        })
        .catch(err => {
            console.error(err);
        });
    };

    useEffect(() => {
        if (params.id) {
            api.get(`/Course/CourseDetails/${params.id}`)
                .then(res => {
                    console.log(res.data);
                    setCourse(res.data);
                    setTriggerFetch(true);
                })
        }
        else {
            fetchChallenges();
            fetchLessons();
        }
    }, [location]);

    useEffect(() => {
        if (triggerFetch && course) {
            fetchChallenges();
            fetchLessons();
            setTriggerFetch(false);
        }
    }, [course, triggerFetch]);

    return (
        <div className="studio-create">
            <h1>{params.id ? 'Edit' : 'Create'} Course</h1>
            <form className="studio-create-form">
                <h2>
                    Course Information
                </h2>
                {error && <div className="studio-error">{error}</div>}
                <div className="studio-create-col">
                    <InputField
                        type='text'
                        label='Title'
                        handleChange={() => {}}
                        inputProps={{
                            value: course.title,
                            onChange: e => handleInputChange(e.target.value, 'title')
                        }}
                    />
                    <div className="form-field studio-create-desc studio-large-desc">
                        <div className="form-label">Description</div>
                        <textarea
                            className='form-input-normal'
                            spellCheck={false}
                            value={course.description}
                            onChange={e => handleInputChange(e.target.value, 'description')}
                        ></textarea>
                    </div>
                </div>
                <div className="studio-create-col">
                    <div className="form-field">
                        <div className="form-label">Difficulty</div>
                        <Slider
                            value={course.difficulty}
                            onChange={(_, val) => {
                                setCourse(prev => ({
                                    ...prev,
                                    difficulty: val
                                }))
                            }}
                            aria-label="Difficulty"
                            defaultValue={0}
                            getAriaValueText={val => difficulties[val]}
                            valueLabelFormat={val => difficulties[val]}
                            valueLabelDisplay="auto"
                            shiftStep={3}
                            step={1}
                            marks
                            min={0}
                            max={9}
                            sx={{
                                color: getColor(course.difficulty)
                            }}
                        />
                        <div 
                            className="form-value-show"
                            style={{
                                color: getColorHex(course.difficulty)
                            }}
                        >{difficulties[course.difficulty]}</div>
                    </div>
                    <div className="studio-banner-upload">
                        <div className="studio-upload-con">
                            <div className='studio-upload-subcon'>
                                <button type="button" onClick={() => bannerFileRef.current?.click()}><MdCloudUpload />  Upload Banner</button>
                            </div>
                            {(course.hasBanner || preview) && <MdDelete 
                                className='studio-upload-remove'
                                onClick={() => {
                                    setPreview(null);
                                    setCourse(prev => ({
                                        ...prev,
                                        hasBanner: false
                                    }))
                                }}
                            />}
                        </div>
                        <div className="studio-banner-preview">
                            {!course.hasBanner && !preview && <span>No banner</span>}
                            {(course.hasBanner || preview) && (course.hasBanner && course.id ? <AuthImage
                                src={course.hasBanner && course.id !== undefined ? `/Course/${course.id}/Banner` : ''}
                                element={ImageWrapper}
                            /> : <img src={preview ?? undefined} />)}
                        </div>
                        <input
                            type="file"
                            ref={bannerFileRef}
                            style={{ display: 'none' }}
                            accept=".jpg,.png,.jpeg"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    console.log('FileReader result:', reader.result);
                                    setPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                    </div>
                </div>
                <h2>
                    Course Lessons & Challenges
                </h2>
                <div className="studio-course-content">
                    <div className="studio-course-col">
                        <SearchBar 
                            label='Challenges'
                            searchWord={searchChallenge}
                            setSearchWord={setSearchChallenge}
                            onSearch={() => fetchChallenges()}
                        />
                        <div className="studio-course-items">
                           {challenges.map((challenge, ci) => (
                            <div 
                                className={`studio-course-item ${currentItem === ci && currentType === 'challenge' ? 'studio-course-active' : ''}`}
                                key={ci}
                                onClick={() => {
                                    setCurrentItem(ci);
                                    setCurrentType('challenge');
                                }}
                            >
                                <img src={(categories as any)[challenge.category.shortForm]} />
                                <div className="studio-course-info">
                                    <h2>{challenge.name}</h2>
                                    <p>{challenge.category.name} - <span style={{ color: getColorHex(challenge.difficulty)}}>
                                            {difficulties[challenge.difficulty]}</span></p>
                                </div>
                           </div>
                           ))}
                        </div>
                        <Link to="/challenges" target='_blank'>All Challenges</Link>
                    </div>
                    <div className="studio-course-col">
                        <SearchBar 
                            label='Lessons'
                            searchWord={searchLesson}
                            setSearchWord={setSearchLesson}
                            onSearch={() => fetchLessons()}
                        />
                        <div className="studio-course-items">
                           {lessons.map((lesson, ci) => (
                            <div 
                                className={`studio-course-item ${currentItem === ci && currentType === 'lesson' ? 'studio-course-active' : ''}`}
                                key={ci}
                                onClick={() => {
                                    setCurrentItem(ci);
                                    setCurrentType('lesson');
                                }}
                            >
                                <img src={(categories as any)[lesson.category.shortForm]} />
                                <div className="studio-course-info">
                                    <h2>{lesson.title}</h2>
                                    <p>{lesson.category.name} - <span style={{ color: getColorHex(lesson.difficulty)}}>
                                            {difficulties[lesson.difficulty]}</span></p>
                                </div>
                           </div>
                           ))}
                        </div>
                        <Link to="/lessons" target='_blank'>All Lessons</Link>
                    </div>
                    <FaAngleDoubleRight
                        onClick={addItemToList}
                    />
                    <div className="studio-course-myitems">
                        {course.items.map((item, ii) => (
                        <div
                            className={`studio-course-myitem ${currentMyItem === ii ? 'studio-course-active' : ''}`}
                            key={ii}
                            onClick={() => {
                                setCurrentMyItem(prev => prev === ii ? null : ii);
                            }}
                        >
                            <div className="studio-course-number">{ii+1}</div>
                            <img src={(categories as any)[item.categoryShort]} />
                            <div className="studio-course-info">
                                <h2>{['Challenge: ', 'Lesson: '][item.type]}{item.name}</h2>
                                <p>{item.categoryName} - <span style={{ color: getColorHex(item.difficulty)}}>
                                            {difficulties[item.difficulty]}</span></p>
                            </div>
                            <div className="studio-course-moving">
                                <FaRegCircleUp
                                    className={ii === 0 ? 'studio-move-disabled' : ''}
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (ii === 0) return;
                                        setCourse(prev => {
                                            const newItems = [...prev.items];
                                            [newItems[ii - 1], newItems[ii]] = [newItems[ii], newItems[ii - 1]];
                                            return { ...prev, items: newItems };
                                        });
                                    }}
                                />
                                <FaRegCircleDown 
                                    className={ii === course.items.length -1 ? 'studio-move-disabled' : ''}
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (ii === course.items.length - 1) return;
                                        setCourse(prev => {
                                            const newItems = [...prev.items];
                                            [newItems[ii], newItems[ii + 1]] = [newItems[ii + 1], newItems[ii]];
                                            return { ...prev, items: newItems };
                                        });
                                    }}
                                />
                                <FaRegCircleXmark 
                                    className={`studio-course-delete`} 
                                    onClick={e => {
                                        e.stopPropagation();
                                        setCourse(prev => ({
                                            ...prev,
                                            items: prev.items.filter((_, i) => i !== ii)
                                        }))
                                    }}
                                />
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
                <div className="studio-create-buttons">
                    {!loading && <>
                    {!params.id && <button type="button" className='studio-btn-add' onClick={createCourse}><FaPlus className='studio-icon' /> Create</button>}
                    {params.id && <>
                        <button type="button" className='studio-btn-save' onClick={updateCourse}><IoIosSave className='studio-icon' /> Save Changes</button>
                        {tokenData?.role === 'Admin' && <button type="button" className='studio-btn-del' onClick={deleteCourse}><FaTrashAlt className='studio-icon' /> Delete</button>}
                    </>}
                    </>}
                    {loading && <CircularProgress color='inherit' size="1.6rem"/>}
                </div>
            </form>
        </div>
    )
}

export default CreateCourse;