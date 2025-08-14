import { useEffect, useState, type SetStateAction } from 'react';
import './Course.css';
import type { CourseData } from './CourseTypes';
import difficulties, { getColorHex } from '@/utils/difficulties';
import { VscServerProcess } from 'react-icons/vsc';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { FaBook } from 'react-icons/fa';
import AuthImage from '@/components/AuthImage/AuthImage';
import ImageWrapper from '@/components/AuthImage/ImageWrapper';
import { Avatar, Rating } from '@mui/material';
import { useNotification } from '@/contexts/Notification/NotificationProvider';
import Review from '@/components/Review/Review';

type RichCourseData = CourseData & {
    reviewCount: number;
    averageRating: number;
    averageReviewDifficulty: number;
    difficultyCounts: {
        difficulty: number;
        count: number;
    }[];
};

function Course() {
    const { showNotification } = useNotification();
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<RichCourseData|null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = () => {
        api.get(`/Course/CourseDetails/${id}`)
            .then(res => {
                setCourse(res.data);
            })
            .catch(err => {
                console.log(err);
            });
    };

    const handleSubmitReview = (text: string, stars: number, difficulty: number, edit: boolean, setEdit: React.Dispatch<SetStateAction<boolean>>) => {
        if (edit) {
            api.put("/Course/UpdateReview", {
                id: course?.id,
                text: text.trim().length > 0 ? text.trim() : undefined,
                stars: stars,
                difficulty: difficulty
            })
            .then(() => {
                showNotification("Review updated successfully", 'success');
                setEdit(false);
                fetchCourse();
            })
            .catch(err => {
                console.error(err);
            })
        }
        else {
            api.post("/Course/SubmitReview", {
                id: course?.id,
                text: text.trim().length > 0 ? text.trim() : undefined,
                stars: stars,
                difficulty: difficulty
            })
            .then(res => {
                showNotification("Review submitted successfully", 'success');
                setCourse(prev =>  prev ? ({...prev, review: res.data }) : prev);
                fetchCourse();
            })
            .catch(err => {
                console.error(err);
            })
        }
    };

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
                            <p><span style={{ color: getColorHex(item.difficulty)}}>{difficulties[item.difficulty]}</span> - {item.categoryName}</p>
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
                    <div className="review-section">
                        <h3>Ratings</h3>
                        <div className="ratings-grid">
                        <div className="rating-item">
                            <div className="rating-label">⭐ Avg. Rating</div>
                            <div className="rating-stars">
                                <Rating value={course.averageRating} precision={0.1} readOnly />
                            </div>
                            <div className="rating-description">Based on user reviews</div>
                        </div>
                        <div className="rating-item">
                            <div className="rating-label">🧠 Review Difficulty</div>
                            {course.reviewCount > 0 && <div className="rating-counts">
                                {course.difficultyCounts.map((diff, i) => {
                                    const maxCount = course.difficultyCounts.map(dc => dc.count).reduce((max, current) => current > max ? current : max);
                                    return (
                                    <div className="rating-count" key={i}
                                        style={{
                                            height: `${diff.count * 100 / maxCount}%`,
                                            backgroundColor: getColorHex(diff.difficulty)
                                        }}
                                    ></div>
                                    )})}
                            </div>}
                            <div className="rating-value" style={{ color: getColorHex(Math.round(course.averageReviewDifficulty ?? course.difficulty)) }}>
                                {difficulties[Math.round(course.averageReviewDifficulty ?? course.difficulty)]}
                            </div>
                            <div className="rating-description">Avg. reported difficulty</div>
                        </div>
                        <div className="rating-description">
                            Based on {course.reviewCount} review(s)
                        </div>
                        <Link className='user-review-link'
                        to={`/reviews/course/${course.id}`}>Read User Reviews</Link>
                        </div>
                    </div>
                    <Review 
                        text={course.review?.text}
                        difficulty={course.review?.difficulty}
                        stars={course.review?.stars}
                        hasReview={course.review ? true : false}
                        label='course'
                        handleSubmit={handleSubmitReview}
                    />
                </div>
            </div>
        </div>
    )
}

export default Course;