import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./SearchPage.css";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import difficulties, { getColorHex } from "@/utils/difficulties";
import categoriesIcon from "@/utils/categories";
import { Avatar, Rating } from "@mui/material";
import type { Course } from "../Courses/CourseTypes";
import CourseCard from "../Courses/CourseCard";
import AuthImage from "@/components/AuthImage/AuthImage";

interface SearchItem {
  id: number;
  title?: string;
  name?: string;
  category: {
    shortForm: string;
    name: string;
  };
  difficulty: number;
  averageRating: number;
}

interface SearchUser {
  id: number;
  username: string;
  role: string;
  totalPoints: number;
}

function SearchPage() {
  const [params, _] = useSearchParams();
  const [challenges, setChallenges] = useState<SearchItem[]>([]);
  const [lessons, setLessons] = useState<SearchItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!params.get("search")) {
      navigate("/");
    }

    const type = params.get("type");

    setChallenges([]);
    setLessons([]);
    setCourses([]);
    setUsers([]);

    if (!type || type === "challenge") {
      api
        .get("/Challenge/Search", {
          params: {
            search: params.get("search"),
            searchDescription: true,
          },
        })
        .then((res) => {
          setChallenges(res.data);
        });
    }

    if (!type || type === "lesson") {
      api
        .get("/Lesson/Search", {
          params: {
            search: params.get("search"),
            searchDescription: true,
          },
        })
        .then((res) => {
          setLessons(res.data);
        });
    }

    if (!type || type === "course") {
      api
        .get("/Course/Search", {
          params: {
            search: params.get("search"),
            limit: 8,
          },
        })
        .then((res) => {
          setCourses(res.data);
        });
    }

    if (!type || type === "user") {
      api
        .get("/User/Search", {
          params: {
            search: params.get("search"),
          },
        })
        .then((res) => {
          setUsers(res.data);
        });
    }
  }, [params]);

  return (
    <div className="search-page">
      <h1>Search Results</h1>
      {challenges.length > 0 && (
        <>
          <h2>
            <Link to="/challenges">Challenges</Link>
          </h2>
          <div className="search-items-grid">
            {challenges.map((c, i) => (
              <div
                className="search-item"
                key={i}
                onClick={() => navigate(`/challenges/${c.id}`)}
              >
                <img
                  className="cat-icon"
                  src={(categoriesIcon as any)[c.category.shortForm]}
                />
                <div className="search-item-name">
                  <strong>{c.name}</strong>
                  <div
                    className="difficulty"
                    style={{ color: getColorHex(c.difficulty) }}
                  >
                    {difficulties[c.difficulty] ?? "Unknown"}
                  </div>
                </div>
                <div className="search-item-category">{c.category.name}</div>
                <Rating
                  value={c.averageRating}
                  precision={0.1}
                  readOnly
                  size="small"
                  className="search-rating"
                />
              </div>
            ))}
          </div>
        </>
      )}

      {lessons.length > 0 && (
        <>
          <h2>
            <Link to="/challenges">Lessons</Link>
          </h2>
          <div className="search-items-grid">
            {lessons.map((c, i) => (
              <div
                className="search-item"
                key={i}
                onClick={() => navigate(`/lessons/${c.id}`)}
              >
                <img
                  className="cat-icon"
                  src={(categoriesIcon as any)[c.category.shortForm]}
                />
                <div className="search-item-name">
                  <strong>{c.title}</strong>
                  <div
                    className="difficulty"
                    style={{ color: getColorHex(c.difficulty) }}
                  >
                    {difficulties[c.difficulty] ?? "Unknown"}
                  </div>
                </div>
                <div className="search-item-category">{c.category.name}</div>
                <Rating
                  value={c.averageRating}
                  precision={0.1}
                  readOnly
                  size="small"
                  className="search-rating"
                />
              </div>
            ))}
          </div>
        </>
      )}
      {courses.length > 0 && (
        <>
          <h2>
            <Link to="/courses">Courses</Link>
          </h2>
          <div className="course-grid">
            {courses.map((course, ind) => (
              <CourseCard course={course} key={ind} />
            ))}
          </div>
        </>
      )}
      {users.length > 0 && (
        <>
          <h2>
            <Link to="/leaderboard">Users</Link>
          </h2>
          <div className="search-items-grid">
            {users.map((u, i) => (
              <div
                className="search-item"
                key={i}
                onClick={() => navigate(`/user/${u.id}`)}
              >
                <AuthImage
                  src={`/User/${u.id}/ProfilePicture`}
                  element={Avatar}
                />
                <div className={`search-role role-${u.role.toLowerCase()}`}>
                  {u.role}
                </div>
                <div className="search-username">{u.username}</div>
                <div className="search-points">{u.totalPoints}pts</div>
              </div>
            ))}
          </div>
        </>
      )}
      {challenges.length === 0 &&
        lessons.length === 0 &&
        courses.length === 0 &&
        users.length === 0 && (
          <div className="search-no-result">No Results</div>
        )}
    </div>
  );
}

export default SearchPage;
