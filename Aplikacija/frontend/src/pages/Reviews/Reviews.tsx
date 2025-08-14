import { useParams } from "react-router-dom";
import "./Reviews.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useNotification } from "@/contexts/Notification/NotificationProvider";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import AuthImage from "@/components/AuthImage/AuthImage";
import React from "react";
import { Avatar, Rating } from "@mui/material";
import difficulties, { getColorHex } from "@/utils/difficulties";

interface Review {
  text?: string;
  stars: number;
  difficulty: number;
  authorName: string;
  authorId: number;
}

function Reviews() {
  const { id, type } = useParams<{ id: string; type: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sortKey, setSortKey] = useState<"difficulty" | "rating">("rating");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [itemName, setItemName] = useState("");
  const { showNotification } = useNotification();
  const handleError = useErrorHandler();

  useEffect(() => {
    const params = {
      page: currentPage,
      sortKey: sortKey,
      sortDir: sortDirection
    };

    api
      .get(`/Review/${type}/${id}`, { params })
      .then((res) => {
        setReviews(res.data.reviews);
        setTotalPages(res.data.totalPages);
        setItemName(res.data.item);

        console.log(res.data)
      })
      .catch((err) => {
        handleError(err, (msg) => showNotification(msg, "error"));
      });
  }, [id, type, sortDirection, sortKey, currentPage]);

  const renderSortButton = (key: "difficulty" | "rating", label: string) => (
    <button
      className={`sort-button ${sortKey === key ? "active" : ""}`}
      onClick={() => {
        if (sortKey === key) {
          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
          setSortKey(key);
          setSortDirection("asc");
        }
      }}
    >
      {label}{" "}
      {sortKey === key ? (
        sortDirection === "asc" ? (
          <FaChevronUp />
        ) : (
          <FaChevronDown />
        )
      ) : (
        ""
      )}
    </button>
  );

  return (
    <div className="user-reviews">
      <div className="user-reviews-header">
        <h2>
          Reviews for {type}: <Link to={`/${type}s/${id}`}>{itemName}</Link>
        </h2>
        <div className="sort-buttons">
          {renderSortButton('rating', 'Sort by Rating')}
          {renderSortButton('difficulty', 'Sort by Difficulty')}
        </div>
      </div>
      <div className="user-reviews-grid">
        {reviews.map((review, i) => (
          <React.Fragment key={i}>
            <div className="user-reviews-user">
              <div className="user-reviews-profile">
                <Link to={`/user/${review.authorId}`}>
                  <AuthImage 
                    src={`/User/${review.authorId}/ProfilePicture`}
                    element={Avatar}
                  />
                </Link>
                <div className="user-reviews-userinfo">
                  <h2>{review.authorName}</h2>
                  <Rating
                    value={review.stars}
                    precision={0.1}
                    readOnly
                  />
                  <h3 style={{
                    color: getColorHex(review.difficulty)
                  }}>{difficulties[review.difficulty]}</h3>
                </div>
              </div>
            </div>
            <div className="user-reviews-text">
              {review.text}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>Next</button>
      </div>
    </div>
  );
}

export default Reviews;
