import { useEffect, useState } from 'react';
import './Course.css';
import type { CourseData } from './CourseTypes';
import difficulties, { getColorHex } from '@/utils/difficulties';
import { VscServerProcess } from 'react-icons/vsc';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { FaBook } from 'react-icons/fa';
import AuthImage from '@/components/AuthImage/AuthImage';
import ImageWrapper from '@/components/AuthImage/ImageWrapper';
import { Avatar } from '@mui/material';

function Course() {
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<CourseData|null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get(`/Course/CourseDetails/${id}`)
            .then(res => {
                setCourse(res.data);
            })
            .catch(err => {
                console.log(err);
            })
    }, [id]);

    if(!course)
        return <>LOADING</>;

    return (
        <div className="course-con">
            <div className="course-header">
                <div className="course-header-info">
                    <h1>{course.title}</h1>
                    <h2 style={{ color: getColorHex(course.difficulty) }}>{difficulties[course.difficulty]}</h2>
                    <div className="course-counts">
                        <div className="course-count">
                            <VscServerProcess /> {course.challengeCount! > 0 ? 
                                `${course.challengeCount} Challenge${course.challengeCount! > 1 ? 's' : ''}` :
                                'No Challenges'
                            }
                        </div>
                        <div className="course-count">
                            <FaBook /> {course.lessonCount! > 0 ? 
                                `${course.lessonCount} Lesson${course.lessonCount! > 1 ? 's' : ''}` :
                                'No Lessons'
                            }
                        </div>
                    </div>
                    <div className="course-description">
                        {course.description}
                    </div>
                </div>
                <div className="course-header-img">
                    {!course.hasBanner && <span>No banner</span>}
                    {course.hasBanner && <AuthImage
                        src={`/Course/${course.id}/Banner`}
                        element={ImageWrapper}
                    />}
                </div>
            </div>
            <div className="course-content">
                <div className="course-items-list">
                    <div className="course-vert-line"></div>
                    {course.items.map((item, ci) => (
                        <div 
                            className="course-list-item" 
                            key={ci}
                            onClick={() => navigate(`/${["challenges", "lessons"][item.type]}/${item.id}`)}
                        >
                            <h2>{["Challenge", "Lesson"][item.type]}: {item.name}</h2>
                            <p><span style={{ color: getColorHex(item.difficulty)}}>{difficulties[item.difficulty]}</span>
                            - {item.categoryName}</p>
                            <div className="course-item-circle"></div>
                        </div>
                    ))}
                </div>
                <div className="course-right">
                    <Link
                        to={`/user/${course.authorId}`}
                        className="author-card meta-card clickable-card"
                    >
                        <h3>Author</h3>
                        <div className="author-info">
                        <AuthImage src={`/User/${course.authorId}/ProfilePicture`} element={Avatar} />
                        <div className="author-details">
                            <p className={`author-role role-${course.authorRole?.toLowerCase()}`}>{course.authorRole}</p>
                            <p className="author-name">{course.authorName}</p>
                        </div>
                        </div>
                    </Link>
                    <div className="already-reviewed-message">
                        <p>You have already reviewed this course.</p>
                        <button onClick={() => {}} className="edit-review-button">
                        ✏️ Edit Review
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Course;