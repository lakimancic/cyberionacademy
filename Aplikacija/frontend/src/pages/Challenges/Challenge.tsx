import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Button,
  TextField,
  Rating,
  MenuItem,
  Stack
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
}

function ChallengeDetails() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [flag, setFlag] = useState("");
  const [stars, setStars] = useState<number | null>(0);
  const [reviewDifficulty, setReviewDifficulty] = useState<number | "">("");
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/Challenge/GetChallengeDetails/${id}`)
      .then(res => setChallenge(res.data))
      .catch(err => console.error("Greška:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitFlag = () => {
    api.post("/Submission/SubmitFlag", {
      challengeId: challenge?.id,
      flag
    }).then(() => alert("Submitted")).catch(() => alert("Error"));
  };

  const handleSubmitReview = () => {
    api.post("/Review/SubmitChallengeReview", {
      challengeId: challenge?.id,
      stars,
      difficulty: reviewDifficulty,
      text: reviewText
    }).then(() => alert("Review sent")).catch(() => alert("Error"));
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
        <div className="challenge-actions-section">
          {(
            <div className="action-item">
              <div className="icon-container"><PlayArrowTwoToneIcon fontSize="large" /></div>
              <div className="action-text">
                <p className="subtitle bold">Start Instance</p>
                <p className="action-description">
                  Start playing the challenge.
                </p>
              </div>
            </div>
          )}

          <div className="action-item">
            <div className="icon-container"><GetAppOutlinedIcon fontSize="large" /></div>
            <div className="action-text">
              <p className="subtitle bold">Download Files</p>
              <p className="action-description">
                Download necessary files to play the challenge.
              </p>
            </div>
          </div>
        </div>

        <div className="challenge-details">
          <div className="challenge-section">
            <h3>Ratings</h3>
            <div className="ratings-grid">

              <div className="rating-item">
                <div className="rating-label">👥 User Solves</div>
                <div className="rating-value">{challenge.solvedCount}</div>
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
                  {difficultyLabels[challenge.averageReviewDifficulty ?? challenge.difficulty]}
                </div>
                <div className="rating-description">Avg. reported difficulty</div>
              </div>

            </div>
          </div>

          <div className="challenge-section">
            <div className="section-header">
              <h3>Submit Flag</h3>
            </div>

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

          </div>

          <div className="challenge-section">
            <div className="section-header">Leave a Review</div>

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

export default ChallengeDetails;
