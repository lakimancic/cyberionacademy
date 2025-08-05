import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  TextField,
  Rating,
  MenuItem,
} from "@mui/material";
import api from "@/lib/api";
import './LessonDetails.css';

const difficultyLabels = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];

interface LessonDetailsData {
  id: number;
  title: string;
  description: string;
  categoryName: string;
  difficulty: number;
  isPublic: boolean;
  averageRating: number;
  reviewCount: number;
  authorId?: number;
  authorName?: string;
  authorRole?: string;
  authorCountry?: string;
  authorAvatarUrl?: string;
}

function LessonDetails() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [stars, setStars] = useState<number | null>(0);
  const [reviewDifficulty, setReviewDifficulty] = useState<number | "">("");
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/Lesson/GetLessonDetails/${id}`)
      .then(res => setLesson(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitReview = () => {
    if (!stars || reviewDifficulty === "" || reviewText.trim() === "") {
      alert("Please fill in all fields.");
      return;
    }

    api.post("/Lesson/SubmitReview", {
      lessonId: lesson?.id,
      stars,
      difficulty: reviewDifficulty,
      text: reviewText
    }).then(() => {
      setStars(0);
      setReviewDifficulty("");
      setReviewText("");
      alert("✅ Review submitted!");
    }).catch(() => {
      alert("❌ Failed to submit review.");
    }).then(() => {
      return api.get(`/Lesson/GetLessonDetails/${id}`);
    }).then(res => setLesson(res.data));
  };

  if (loading) return <div>Loading...</div>;
  if (!lesson) return <div>Lesson not found.</div>;

  return (
    <div className="challenge-details-container"> 
      <div className="challenge-header">
        <div className="challenge-header-left">
          <h2>{lesson.title}</h2>
          <p>{lesson.description}</p>
        </div>

        <div className="challenge-header-right">
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
            <p>{difficultyLabels[lesson.difficulty]}</p>
          </div>
          <Link to={`/lesson/play/${lesson.id}`} className="meta-card btn-action">
            Start Learning
          </Link>
          <Link to={`/lesson/quiz/${lesson.id}`} className="meta-card btn-action">
            Quiz
          </Link>
        </div>
      </div>

      <div className="challenge-content-row">
        <div className="challenge-sidebar">
          {lesson.authorId && (
            <Link
              to={`/user/${lesson.authorId}`}
              className="author-card meta-card clickable-card"
            >
              <h3>Author</h3>
              <div className="author-info">
                <img
                  src={lesson.authorAvatarUrl || "/default-avatar.png"}
                  alt={lesson.authorName ?? "Author"}
                  className="author-avatar"
                  onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                />
                <div className="author-details">
                  <p className="author-name">{lesson.authorName}</p>
                  <p className="author-role-country">
                    {lesson.authorRole} | {lesson.authorCountry}
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="challenge-details">
          <div className="challenge-section">
            <h3>Ratings</h3>
            <div className="ratings-grid">
              <div className="rating-item">
                <div className="rating-label">⭐ Avg. Rating</div>
                <div className="rating-stars">
                  <Rating value={lesson.averageRating} precision={0.1} readOnly />
                </div>
              </div>
              <div className="rating-description">
                Based on {lesson.reviewCount} review(s)
              </div>
            </div>
          </div>

          <div className="challenge-section">
            <h3>Leave a Review</h3>
            <div className="review-form">
              <div className="form-row">
                <label className="form-label">Your Rating</label>
                <div className="rating-stars">
                  <Rating value={stars} onChange={(_, v) => setStars(v)} />
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Difficulty</label>
                <TextField
                  select
                  size="small"
                  value={reviewDifficulty}
                  onChange={(e) => setReviewDifficulty(Number(e.target.value))}
                  fullWidth
                >
                  {difficultyLabels.map((label, index) => (
                    <MenuItem key={index} value={index}>{label}</MenuItem>
                  ))}
                </TextField>
              </div>

              <div className="form-row">
                <label className="form-label">Comment</label>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  size="small"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>

              <div
                className="action-item action-clickable submit-button"
                onClick={handleSubmitReview}
              >
                <div className="submit-text">Submit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonDetails;
