import { useEffect, useState, type SetStateAction } from "react";
import { useParams, Link } from "react-router-dom";
import { TextField, Rating, CircularProgress, Avatar } from "@mui/material";
import api from "@/lib/api";
import "./Challenge.css";
import PlayArrowTwoToneIcon from "@mui/icons-material/PlayArrowTwoTone";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import StopIcon from "@mui/icons-material/Stop";
import MoreTimeIcon from "@mui/icons-material/MoreTime";
import RouterIcon from "@mui/icons-material/Router";
import Review from "@/components/Review/Review";
import { useNotification } from "@/contexts/Notification/NotificationProvider";
import difficulties, { getColorHex } from "@/utils/difficulties";
import categoriesIcon from "@/utils/categories";
import AuthImage from "@/components/AuthImage/AuthImage";
import { MdContactSupport } from "react-icons/md";

interface ChallengeDetailsData {
  id: number;
  name: string;
  description: string;
  categoryName: string;
  categoryShort: string;
  points: number;
  averageRating: number;
  solvedCount: number;
  difficulty: number;
  isArchived: boolean;
  isPublic: boolean;
  dockerImage?: string | null;
  averageReviewDifficulty?: number;
  difficultyCounts: {
    difficulty: number;
    count: number;
  }[];
  review?: {
    text: string;
    stars: number;
    difficulty: number;
  };
  reviewCount: number;
  authorId: number;
  authorName: string;
  createdAt: string;
  authorRole: string;
  downloadFile?: string;
}

interface Service {
  portIn: number;
  portOut: number;
  type: number;
}

interface Instance {
  timeRem: number;
  services: Service[];
}

const formatTime = (time: number) => {
  const secs = time % 60;
  const mins = Math.floor(time / 60);

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

function ChallengeDetails() {
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();
  const [challenge, setChallenge] = useState<ChallengeDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [flag, setFlag] = useState("");
  const [flagResult, setFlagResult] = useState<null | "correct" | "incorrect">(
    null
  );
  const [hasSolved, setHasSolved] = useState<boolean | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);
  const [instanceLoad, setInstanceLoad] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchChallenge();
  }, [id]);

  const fetchChallenge = () => {
    api
      .get(`/Challenge/GetChallengeDetails/${id}`)
      .then((res) => {
        setChallenge(res.data);
        if (res.data.instance) {
          if (res.data.instance.timeRem < 0) res.data.instance.timeRem = 0;
          res.data.instance.timeRem = Math.floor(res.data.instance.timeRem);
        }
        setHasSolved(res.data.hasSolved);
        setInstance(res.data.instance);
      })
      .catch((err) => console.error("Greška:", err))
      .finally(() => setLoading(false));
  };

  const handleSubmitFlag = () => {
    api
      .post("/Challenge/SubmitFlag", {
        challengeId: challenge?.id,
        flag,
      })
      .then((res) => {
        setFlagResult(res.data.correct ? "correct" : "incorrect");
      })
      .catch(() => {
        showNotification("Error submitting flag", "error");
        setFlagResult(null);
      });
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
        .put("/Challenge/UpdateReview", {
          id: challenge?.id,
          text: text.trim().length > 0 ? text.trim() : undefined,
          stars: stars,
          difficulty: difficulty,
        })
        .then(() => {
          showNotification("Review updated successfully", "success");
          setEdit(false);
          fetchChallenge();
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      api
        .post("/Challenge/SubmitReview", {
          id: challenge?.id,
          text: text.trim().length > 0 ? text.trim() : undefined,
          stars: stars,
          difficulty: difficulty,
        })
        .then(() => {
          showNotification("Review submitted successfully", "success");
          fetchChallenge();
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  const downloadFiles = () => {
    if (!challenge) return;

    api
      .get(`/Challenge/DownloadFile/${challenge.id}`, {
        responseType: "blob",
      })
      .then((resp) => {
        const blob = new Blob([resp.data]);
        let fileName = challenge.downloadFile ?? "unknown";

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.log(err));
  };

  const startInstance = () => {
    if (!challenge) return;
    setInstanceLoad(true);

    api
      .get(`/Challenge/StartInstance/${challenge.id}`)
      .then((resp) => {
        if (resp.data) {
          if (resp.data.timeRem < 0) resp.data.timeRem = 0;
          resp.data.timeRem = Math.floor(resp.data.timeRem);
        }
        setInstance(resp.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setInstanceLoad(false));
  };

  const stopInstance = () => {
    if (!challenge) return;

    api
      .delete(`/Challenge/StopInstance/${challenge.id}`)
      .catch((err) => console.error(err))
      .finally(() => setInstance(null));
  };

  const extendInstance = () => {
    if (!challenge) return;

    api
      .put(`/Challenge/ExtendInstance/${challenge.id}`)
      .then((resp) => {
        setInstance((prev) => (prev ? { ...prev, timeRem: resp.data } : null));
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setInstance((prev) =>
        prev ? { ...prev, timeRem: Math.max(prev?.timeRem - 1, 0) } : null
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!challenge) return <div>Challenge not found</div>;

  return (
    <div className="challenge-details-container">
      <div className="challenge-header">
        <div className="challenge-header-left">
          <img src={(categoriesIcon as any)[challenge.categoryShort]} />
          <div className="challenge-header-info">
            <h2>{challenge.name}</h2>
            <p>{challenge.description}</p>
          </div>
        </div>

        <div className="challenge-header-right">
          <div className="meta-card">
            <p className="meta-label">📅 Created</p>
            <p>
              {new Date(challenge.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
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
            <p
              style={{
                color: getColorHex(challenge.difficulty),
                fontWeight: 600,
              }}
            >
              {difficulties[challenge.difficulty]}
            </p>
          </div>
        </div>
      </div>

      <div className="challenge-content-row">
        <div className="challenge-sidebar">
          <div className="challenge-actions-section">
            {instance && (
              <div className="action-instance">
                <div className="icon-container">
                  <RouterIcon fontSize="large" />
                </div>
                <div className="action-text">
                  <p className="subtitle bold">Instance Information</p>
                  {instance.services.map((ins, ind) => (
                    <p className="instance-info" key={ind}>
                      <a
                        href={`http://${import.meta.env.VITE_HOST}:${
                          ins.portOut
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {import.meta.env.VITE_HOST}:{ins.portOut}
                      </a>{" "}
                      / {ins.type === 0 ? "TCP" : "UDP"}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div
              className={`action-item ${
                !challenge.dockerImage ? "disabled-action" : ""
              }`}
              style={{
                pointerEvents: !challenge.dockerImage ? "none" : "auto",
              }}
              onClick={() => {
                if (instance) stopInstance();
                else startInstance();
              }}
            >
              <div className="icon-container">
                {instance ? (
                  <StopIcon fontSize="large" />
                ) : instanceLoad ? (
                  <CircularProgress />
                ) : (
                  <PlayArrowTwoToneIcon fontSize="large" />
                )}
              </div>
              <div className="action-text">
                <p className="subtitle bold">
                  {instance ? "Stop Instance" : "Start Instance"}
                </p>
                <p className="action-description">
                  {challenge.dockerImage
                    ? instance
                      ? "Stop instance when you're done."
                      : "Start playing the challenge."
                    : "Not available for this challenge."}
                </p>
              </div>
            </div>

            {instance && (
              <div
                className={`action-item ${
                  instance.timeRem > 600 ? "disabled-action" : ""
                }`}
                style={{
                  pointerEvents: instance.timeRem > 600 ? "none" : "auto",
                }}
                onClick={() => extendInstance()}
              >
                <div className="icon-container">
                  <MoreTimeIcon fontSize="large" />
                </div>
                <div className="action-text">
                  <p className="subtitle bold">Extend Instance</p>
                  <p className="action-description">If you need more time.</p>
                </div>
                <div
                  className={`action-time ${
                    instance.timeRem <= 0 ? "action-time-end" : ""
                  }`}
                >
                  {formatTime(instance.timeRem)}
                </div>
              </div>
            )}

            <div
              className={`action-item ${
                !challenge.downloadFile ? "disabled-action" : ""
              }`}
              style={{
                pointerEvents: !challenge.downloadFile ? "none" : "auto",
              }}
              onClick={downloadFiles}
            >
              <div className="icon-container">
                <GetAppOutlinedIcon fontSize="large" />
              </div>
              <div className="action-text">
                <p className="subtitle bold">Download files</p>
                <p className="action-description">
                  {challenge.downloadFile
                    ? "Download necessary files to play this challenge."
                    : "Not available for this challenge."}
                </p>
              </div>
            </div>
          </div>
          <Link
            to={`/user/${challenge.authorId}`}
            className="author-card meta-card clickable-card"
          >
            <h3>Author</h3>
            <div className="author-info">
              <AuthImage
                src={`/User/${challenge.authorId}/ProfilePicture`}
                element={Avatar}
              />
              <div className="author-details">
                <p
                  className={`author-role role-${challenge.authorRole?.toLowerCase()}`}
                >
                  {challenge.authorRole}
                </p>
                <p className="author-name">{challenge.authorName}</p>
              </div>
            </div>
          </Link>
          <Link
            to={`/new-support/challenge/${challenge.id}`}
            className="call-support"
          >
            <MdContactSupport /> Need Help?
          </Link>
        </div>

        <div className="challenge-details">
          <div className="challenge-section">
            <h3>Ratings</h3>
            <div className="ratings-grid">
              <div className="rating-item">
                <div className="rating-label">👥 User Solves</div>
                <div className="rating-value">{challenge.solvedCount}</div>
                <div className="rating-description">
                  Number of users who completed the challenge
                </div>
              </div>

              <div className="rating-item">
                <div className="rating-label">⭐ Avg. Rating</div>
                <div className="rating-stars">
                  <Rating
                    value={challenge.averageRating}
                    precision={0.1}
                    readOnly
                  />
                </div>
                <div className="rating-description">Based on user reviews</div>
              </div>

              <div className="rating-item">
                <div className="rating-label">🧠 Review Difficulty</div>
                {challenge.reviewCount > 0 && (
                  <div className="rating-counts">
                    {challenge.difficultyCounts.map((diff, i) => {
                      const maxCount = challenge.difficultyCounts
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
                        challenge.averageReviewDifficulty ??
                          challenge.difficulty
                      )
                    ),
                    fontWeight: 600,
                  }}
                >
                  {
                    difficulties[
                      Math.round(
                        challenge.averageReviewDifficulty ??
                          challenge.difficulty
                      )
                    ]
                  }
                </div>
                <div className="rating-description">
                  Avg. reported difficulty
                </div>
              </div>
              <div className="rating-description">
                Based on {challenge.reviewCount} review(s)
              </div>
              <Link
                className="user-review-link"
                to={`/reviews/challenge/${challenge.id}`}
              >
                Read User Reviews
              </Link>
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
                <p className="solved-text">
                  You have already solved this challenge!
                </p>
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

                <div
                  className="action-item action-clickable submit-button"
                  onClick={handleSubmitFlag}
                >
                  <div className="submit-text">Submit</div>
                </div>

                {flagResult === "correct" && (
                  <p className="flag-result success">
                    ✅ Congratulations, the flag is correct!
                  </p>
                )}
                {flagResult === "incorrect" && (
                  <p className="flag-result error">
                    ❌ Incorrect flag. Try again.
                  </p>
                )}
              </>
            )}
          </div>
          <Review
            className="challenge-section"
            text={challenge.review?.text}
            difficulty={challenge.review?.difficulty}
            stars={challenge.review?.stars}
            hasReview={challenge.review ? true : false}
            label="challenge"
            handleSubmit={handleSubmitReview}
          />
        </div>
      </div>
    </div>
  );
}

export default ChallengeDetails;
