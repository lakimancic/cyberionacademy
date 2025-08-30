import { Avatar, Rating } from "@mui/material";
import "./CourseCard.css";
import difficulties, { getColorHex } from "@/utils/difficulties";
import { VscServerProcess } from "react-icons/vsc";
import { FaBook } from "react-icons/fa";
import AuthImage from "@/components/AuthImage/AuthImage";
import { useNavigate } from "react-router-dom";
import ImageWrapper from "@/components/AuthImage/ImageWrapper";

interface Course {
  id: number;
  title: string;
  description?: string;
  authorName?: string;
  authorId?: number;
  averageRating: number;
  difficulty: number;
  lessonCount: number;
  challengeCount: number;
  hasBanner: boolean;
}

type Props = {
  course: Course;
};

function CourseCard({ course }: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="course-card"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="course-card-img">
        {!course.hasBanner && <span>No Banner</span>}
        {course.hasBanner && (
          <AuthImage
            src={`/Course/${course.id}/Banner`}
            element={ImageWrapper}
          />
        )}
      </div>
      <div className="course-card-info">
        <h2>{course.title}</h2>
        <h3 style={{ color: getColorHex(course.difficulty) }}>
          {difficulties[course.difficulty] ?? "Unknown"}
        </h3>
        <Rating
          value={course.averageRating}
          precision={0.1}
          readOnly
          size="small"
          className="course-card-rating"
        />
        <div className="course-card-count">
          <VscServerProcess />{" "}
          {course.challengeCount > 0
            ? `${course.challengeCount} Challenge${
                course.challengeCount > 1 ? "s" : ""
              }`
            : "No Challenges"}
        </div>
        <div className="course-card-author">
          <AuthImage
            src={
              course.authorId ? `/User/${course.authorId}/ProfilePicture` : ""
            }
            element={Avatar}
          />
          {course.authorName ?? "Unknown"}
        </div>
        <div className="course-card-count">
          <FaBook />{" "}
          {course.lessonCount > 0
            ? `${course.lessonCount} Lesson${course.lessonCount > 1 ? "s" : ""}`
            : "No Lessons"}
        </div>
      </div>
      <div className="course-card-description">{course.description}</div>
    </div>
  );
}

export default CourseCard;
