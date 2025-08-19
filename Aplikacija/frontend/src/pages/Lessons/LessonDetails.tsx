import { useEffect, useState, type SetStateAction } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import "./LessonDetails.css";
import difficulties, { getColorHex } from "@/utils/difficulties";
import categories from "@/utils/categories";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Review from "@/components/Review/Review";
import AuthImage from "@/components/AuthImage/AuthImage";
import { Avatar, Rating } from "@mui/material";
import { useNotification } from "@/contexts/Notification/NotificationProvider";
import { MdContactSupport } from "react-icons/md";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface LessonDetailsData {
  id: number;
  title: string;
  description: string;
  categoryName: string;
  categoryShort: string;
  difficulty: number;
  isPublic: boolean;
  authorId?: number;
  authorName?: string;
  authorRole?: string;
  authorCountry?: string;
  authorAvatarUrl?: string;
  quizId?: number;
  reviewCount: number;
  averageRating: number;
  averageReviewDifficulty: number;
  difficultyCounts: {
    difficulty: number;
    count: number;
  }[];
  review?: {
    text: string;
    stars: number;
    difficulty: number;
  };
  content?: string;
}

function LessonDetails() {
  const { showNotification } = useNotification();
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const handleError = useErrorHandler();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchLesson();
  }, [id]);

  const fetchLesson = () => {
    api
      .get(`/Lesson/GetLessonDetails/${id}`)
      .then((res) => setLesson(res.data))
      .catch(err => {
        if (err.response.status == 404)
          navigate("/lessons");
        else
          handleError(err, msg => showNotification(msg, 'error'));
      })
      .finally(() => setLoading(false));
  };

  const handleSubmitReview = (
    text: string,
    stars: number,
    difficulty: number,
    edit: boolean,
    setEdit: React.Dispatch<SetStateAction<boolean>>
  ) => {
    if (edit) {
      api
        .put("/Lesson/UpdateReview", {
          id: lesson?.id,
          text: text.trim().length > 0 ? text.trim() : undefined,
          stars: stars,
          difficulty: difficulty,
        })
        .then(() => {
          showNotification("Review updated successfully", "success");
          setEdit(false);
          fetchLesson();
        })
        .catch((err) => {
          handleError(err, msg => showNotification(msg, 'error'));
        });
    } else {
      api
        .post("/Lesson/SubmitReview", {
          id: lesson?.id,
          text: text.trim().length > 0 ? text.trim() : undefined,
          stars: stars,
          difficulty: difficulty,
        })
        .then(() => {
          showNotification("Review submitted successfully", "success");
          fetchLesson();
        })
        .catch((err) => {
          handleError(err, msg => showNotification(msg, 'error'));
        });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!lesson) return <div>Lesson not found.</div>;

  return (
    <div className="lesson-details-container">
      <div className="lesson-header">
        <div className="lesson-header-left">
          <img src={(categories as any)[lesson.categoryShort]} />
          <div className="lesson-header-info">
            <h2>{lesson.title}</h2>
            <p>{lesson.description}</p>
          </div>
        </div>

        <div className="lesson-header-right">
          <div className="meta-card">
            <p className="meta-label">🌐 Access</p>
            <p>{lesson.isPublic ? "Public" : "Private"}</p>
          </div>
          <div className="meta-card">
            <p className="meta-label">🧾 Category</p>
            <p>{lesson.categoryName}</p>
          </div>
          <div className="meta-card">
            <p className="meta-label">🧠 Difficulty</p>
            <p
              style={{
                color: getColorHex(lesson.difficulty),
                fontWeight: 600,
              }}
            >
              {difficulties[lesson.difficulty]}
            </p>
          </div>
          {lesson.quizId && (
            <Link
              to={`/quiz/${lesson.quizId}`}
              className="meta-card btn-action"
            >
              Quiz
            </Link>
          )}
        </div>
      </div>
      <div className="lesson-content-con">
        <div className="lesson-content">
          <ReactMarkdown
            children={lesson.content}
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
        <div className="lesson-right">
          <Link
            to={`/user/${lesson.authorId}`}
            className="author-card meta-card clickable-card"
          >
            <h3>Author</h3>
            <div className="author-info">
              <AuthImage
                src={`/User/${lesson.authorId}/ProfilePicture`}
                element={Avatar}
              />
              <div className="author-details">
                <p
                  className={`author-role role-${lesson.authorRole?.toLowerCase()}`}
                >
                  {lesson.authorRole}
                </p>
                <p className="author-name">{lesson.authorName}</p>
              </div>
            </div>
          </Link>
          <Link
            to={`/new-support/lessons/${lesson.id}`}
            className="call-support"
          ><MdContactSupport /> Need Help?</Link>
          <div className="review-section">
            <h3>Ratings</h3>
            <div className="ratings-grid">
              <div className="rating-item">
                <div className="rating-label">⭐ Avg. Rating</div>
                <div className="rating-stars">
                  <Rating
                    value={lesson.averageRating}
                    precision={0.1}
                    readOnly
                  />
                </div>
                <div className="rating-description">Based on user reviews</div>
              </div>
              <div className="rating-item">
                <div className="rating-label">🧠 Review Difficulty</div>
                {lesson.reviewCount > 0 && (
                  <div className="rating-counts">
                    {lesson.difficultyCounts.map((diff, i) => {
                      const maxCount = lesson.difficultyCounts
                        .map((dc) => dc.count)
                        .reduce((max, current) =>
                          current > max ? current : max
                        );
                      return (
                        <div
                          className="rating-count"
                          key={i}
                          style={{
                            height: `${(diff.count * 100) / maxCount}%`,
                            backgroundColor: getColorHex(diff.difficulty),
                          }}
                        ></div>
                      );
                    })}
                  </div>
                )}
                <div
                  className="rating-value"
                  style={{
                    color: getColorHex(
                      Math.round(
                        lesson.averageReviewDifficulty ?? lesson.difficulty
                      )
                    ),
                    fontWeight: 600,
                  }}
                >
                  {
                    difficulties[
                      Math.round(
                        lesson.averageReviewDifficulty ?? lesson.difficulty
                      )
                    ]
                  }
                </div>
                <div className="rating-description">
                  Avg. reported difficulty
                </div>
              </div>
              <div className="rating-description">
                Based on {lesson.reviewCount} review(s)
              </div>
              <Link
                className="user-review-link"
                to={`/reviews/lesson/${lesson.id}`}
              >
                Read User Reviews
              </Link>
            </div>
          </div>
          <Review
            text={lesson.review?.text}
            difficulty={lesson.review?.difficulty}
            stars={lesson.review?.stars}
            hasReview={lesson.review ? true : false}
            label="lesson"
            handleSubmit={handleSubmitReview}
          />
        </div>
      </div>
    </div>
  );
}

export default LessonDetails;
