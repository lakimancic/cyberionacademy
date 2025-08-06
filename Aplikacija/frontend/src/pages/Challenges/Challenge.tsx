import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  TextField,
  Rating,
  MenuItem,
} from "@mui/material";
import api from "@/lib/api";
import './Challenge.css';
import PlayArrowTwoToneIcon from '@mui/icons-material/PlayArrowTwoTone';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';

const difficultyLabels = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];

interface ChallengeDetailsData {
  id: number;
  name: string;
  description: string;
  categoryName: string;
  points: number;
  averageRating: number;
  solvedCount: number;
  difficulty: number;
  isArchived: boolean;
  isPublic: boolean;
  dockerImage?: string | null;
  averageReviewDifficulty?: number;
  reviewCount: number;
  autorId: number;
  autorName: string;
  createdAt: string;
  autorRole: string;
  autorCountry: string;
  atributZaDownload?: string;////placeholder

}

function ChallengeDetails() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);
  const [flag, setFlag] = useState("");
  const [stars, setStars] = useState<number | null>(0);
  const [reviewDifficulty, setReviewDifficulty] = useState<number | "">("");
  const [reviewText, setReviewText] = useState("");
  const [flagResult, setFlagResult] = useState<null | "correct" | "incorrect">(null);
  const [hasSolved, setHasSolved] = useState<boolean | null>(null);
  const [editingReview, setEditingReview] = useState(false);


  useEffect(() => {
    if (!id) return;
    api.get(`/Challenge/HasSolved?challengeId=${id}`)
      .then(res => setHasSolved(res.data))
      .catch(() => setHasSolved(false));
  }, [id]);


  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/Challenge/GetChallengeDetails/${id}`)
      .then(res => setChallenge(res.data))
      .catch(err => console.error("Greška:", err))
      .finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    if (!id) return;

    api.get(`/Challenge/HasReviewed?challengeId=${id}`)
      .then(res => setHasReviewed(res.data))
      .catch(() => setHasReviewed(false));
  }, [id]);
  useEffect(() => {
    if (!id) return;

    api.get(`/Challenge/HasReviewed?challengeId=${id}`)
      .then(res => {
        setHasReviewed(res.data);
        if (res.data) {
          api.get(`/Challenge/GetUserReview?challengeId=${id}`)
            .then(res => {
              setStars(res.data.stars);
              setReviewDifficulty(res.data.difficulty);
              setReviewText(res.data.text);
            });
        }
      })
      .catch(() => setHasReviewed(false));
  }, [id]);

  const handleSubmitFlag = () => {
    api.post("/Challenge/SubmitFlag", {
      challengeId: challenge?.id,
      flag
    })
      .then((res) => {
        setFlagResult(res.data.correct ? "correct" : "incorrect");
      })
      .catch(() => {
        alert("Error submitting flag.");
        setFlagResult(null);
      });
  };


  const handleSubmitReview = () => {
    if (stars === null || reviewDifficulty === null || reviewText.trim() === "") {
      alert("Please fill in all fields before submitting your review.");
      return;
    }

    const payload = {
      challengeId: challenge?.id,
      stars,
      difficulty: reviewDifficulty,
      text: reviewText.trim()
    };

    const request = hasReviewed
      ? api.put("/Challenge/UpdateReview", payload)
      : api.post("/Challenge/SubmitChallengeReview", payload);

    request.then(() => {
      alert("Review submitted successfully!");
      setEditingReview(false);
    }).catch(() => {
      alert("Failed to submit review. Please try again.");
    })
    .then(() => {
      return api.get(`/Challenge/GetChallengeDetails/${id}`);
    }).then(res => setChallenge(res.data));
  };



  if (loading) return <div>Loading...</div>;
  if (!challenge) return <div>Challenge not found</div>;

  return (
    <div className="challenge-details-container">
      <div className="challenge-header">
        <div className="challenge-header-left">
          <h2>{challenge.name}</h2>
          <p>{challenge.description}</p>
        </div>

        <div className="challenge-header-right">
          <div className="meta-card">
            <p className="meta-label">📅 Created</p>
            <p>{new Date(challenge.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}</p>
          </div>
          <div className="meta-card">
            <p className="meta-label">🌐 Access</p>
            <p>{challenge.isPublic ? "Public" : "Private"}</p>
          </div>

          <div className="meta-card">
            <p className="meta-label">🧾 Category</p>
            <p>{challenge.categoryName}</p>
          </div>
          <div className="meta-card">
            <p className="meta-label">🎯 Points</p>
            <p>{challenge.points}</p>
          </div>
          <div className="meta-card">
            <p className="meta-label">🧠 Difficulty</p>
            <p>{difficultyLabels[challenge.difficulty]}</p>
          </div>


        </div>
      </div>

      <div className="challenge-content-row">
        <div className="challenge-sidebar">
          <div className="challenge-actions-section">
            <div
              className={`action-item ${!challenge.dockerImage ? "disabled-action" : ""}`}
              style={{ pointerEvents: !challenge.dockerImage ? "none" : "auto" }}
            >
              <div className="icon-container">
                <PlayArrowTwoToneIcon fontSize="large" />
              </div>
              <div className="action-text">
                <p className="subtitle bold">Start Instance</p>
                <p className="action-description">
                  {challenge.dockerImage ? "Start playing the challenge." : "Not available for this challenge."}
                </p>
              </div>
            </div>

            <div
              className={`action-item ${!challenge.atributZaDownload ? "disabled-action" : ""}`}
              style={{ pointerEvents: !challenge.atributZaDownload ? "none" : "auto" }}
            >
              <div className="icon-container">
                <GetAppOutlinedIcon fontSize="large" />
              </div>
              <div className="action-text">
                <p className="subtitle bold">Download files</p>
                <p className="action-description">
                  {challenge.atributZaDownload ? "Download necessary files to play this challenge." : "Not available for this challenge."}
                </p>
              </div>
            </div>
          </div>
          <Link
            to={`/user/${challenge.autorId}`}
            className="author-card meta-card clickable-card"
          >
            <h3>Author</h3>
            <div className="author-info">
              <img
                src={"/default-avatar.png"}
                alt={challenge.autorName}
                className="author-avatar"
              />
              <div className="author-details">
                <p className="author-name">{challenge.autorName}</p>
                <p className="author-role-country">
                  {challenge.autorRole} | {challenge.autorCountry}
                </p>
              </div>
            </div>
          </Link>

        </div>


        <div className="challenge-details">
          <div className="challenge-section">
            <h3>Ratings</h3>
            <div className="ratings-grid">

              <div className="rating-item">
                <div className="rating-label">👥 User Solves</div>
                <div className="rating-value">{challenge.solvedCount}</div>
                <div className="rating-description">Number of users who completed the challenge</div>
              </div>

              <div className="rating-item">
                <div className="rating-label">⭐ Avg. Rating</div>
                <div className="rating-stars">
                  <Rating value={challenge.averageRating} precision={0.1} readOnly />
                </div>
                <div className="rating-description">Based on user reviews</div>
              </div>

              <div className="rating-item">
                <div className="rating-label">🧠 Review Difficulty</div>
                <div className="rating-value">
                  {difficultyLabels[Math.round(challenge.averageReviewDifficulty ?? challenge.difficulty)]}

                </div>
                <div className="rating-description">Avg. reported difficulty</div>
              </div>
              <div className="rating-description">Based on {challenge.reviewCount} review(s)</div>
            </div>
          </div>

          <div className="challenge-section">
            <div className="section-header">
              <h3>Submit Flag</h3>
            </div>

            {hasSolved === null ? (
              <p>Loading...</p>
            ) : hasSolved ? (
              <div className="solved-message">
                <p className="solved-text">You have already solved this challenge!</p>
                <div className="solved-icon">
                  <span className="checkmark">✓</span>
                </div>
              </div>

            ) : (
              <>
                <TextField
                  label="Flag"
                  variant="outlined"
                  fullWidth
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className="flag-input"
                  sx={{ mb: 2 }}
                />

                <div className="action-item action-clickable submit-button" onClick={handleSubmitFlag}>
                  <div className="submit-text">Submit</div>
                </div>

                {flagResult === "correct" && (
                  <p className="flag-result success">✅ Congratulations, the flag is correct!</p>
                )}
                {flagResult === "incorrect" && (
                  <p className="flag-result error">❌ Incorrect flag. Try again.</p>
                )}
              </>
            )}
          </div>



          <div className="challenge-section">
            <div className="section-header">Leave a Review</div>

            {hasReviewed === null ? (
              <p>Loading review status...</p>
            ) : hasReviewed && !editingReview ? (
              <div className="already-reviewed-message">
                <p>You have already reviewed this challenge.</p>
                <button onClick={() => setEditingReview(true)} className="edit-review-button">
                  ✏️ Edit Review
                </button>
              </div>
            ) : (
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
                  <div className="submit-text">{hasReviewed ? "Update Review" : "Submit"}</div>
                </div>
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}

export default ChallengeDetails;
