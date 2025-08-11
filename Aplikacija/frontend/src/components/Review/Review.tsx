import { Rating, Slider, TextField } from "@mui/material";
import "./Review.css";
import { useState, type SetStateAction } from "react";
import difficulties, { getColor, getColorHex } from "@/utils/difficulties";

type Props = {
  handleSubmit: (
    text: string,
    stars: number,
    difficulty: number,
    edit: boolean,
    setEdit: React.Dispatch<SetStateAction<boolean>>
  ) => void;
  stars?: number | null;
  difficulty?: number;
  text?: string;
  hasReview: boolean;
  label: string;
  className?: string;
};

function Review(props: Props) {
  const [stars, setStars] = useState<number | null>(props.stars ?? null);
  const [difficulty, setDifficutly] = useState<number>(props.difficulty ?? 0);
  const [text, setText] = useState<string>(props.text ?? "");
  const [editingReview, setEditingReview] = useState(false);

  return (
    <div className={props.className ?? "review-section"}>
      <div className="section-header">Leave a Review</div>
      {props.hasReview && !editingReview ? (
        <div className="already-reviewed-message">
          <p>You have already reviewed this {props.label}.</p>
          <button
            onClick={() => setEditingReview(true)}
            className="edit-review-button"
          >
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

          <div className="form-field">
            <div className="form-label">Difficulty</div>
            <Slider
              value={difficulty}
              onChange={(_, val) => setDifficutly(val)}
              aria-label="Difficulty"
              defaultValue={0}
              getAriaValueText={(val) => difficulties[val]}
              valueLabelFormat={(val) => difficulties[val]}
              valueLabelDisplay="auto"
              shiftStep={3}
              step={1}
              marks
              min={0}
              max={9}
              sx={{
                color: getColor(difficulty),
              }}
            />
            <div
              className="form-value-show"
              style={{
                color: getColorHex(difficulty),
              }}
            >
              {difficulties[difficulty]}
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Comment</label>
            <TextField
              multiline
              rows={4}
              fullWidth
              size="small"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div
            className="action-item action-clickable submit-button"
            onClick={() =>
              props.handleSubmit(
                text,
                stars ?? 1,
                difficulty,
                editingReview,
                setEditingReview
              )
            }
          >
            <div className="submit-text">
              {props.hasReview ? "Update Review" : "Submit"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Review;
