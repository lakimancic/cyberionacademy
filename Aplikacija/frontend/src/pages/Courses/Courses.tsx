import "./Courses.css";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { MenuItem, Select } from "@mui/material";
import difficulties from "@/utils/difficulties";
import SearchBar from "@/components/SearchBar/SearchBar";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import CourseCard from "./CourseCard";
import type { Course } from "./CourseTypes";
import { useNotification } from "@/contexts/Notification/NotificationProvider";
import { useErrorHandler } from "@/hooks/useErrorHandler";

function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sortKey, setSortKey] = useState<"name" | "rating">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showNotification } = useNotification();
  const handleError = useErrorHandler();

  const pageSize = 9;

  useEffect(() => {
    fetchCourses();
  }, [sortKey, sortDirection, selectedDifficulty, currentPage]);

  const fetchCourses = () => {
    const params: any = {
      sortKey,
      sortDirection,
      page: currentPage,
      pageSize,
      search: search !== "" ? search : undefined,
      difficulty: selectedDifficulty !== -1 ? selectedDifficulty : undefined,
    };

    api
      .get("/Course/GetCourses", { params })
      .then((res) => {
        setCourses(res.data.items);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => {
        handleError(err, (msg) => showNotification(msg, "error"));
      });
  };

  const renderSortButton = (key: "name" | "rating", label: string) => (
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
    <div className="courses-container">
      <h2 className="title">Courses</h2>

      <div className="course-controls-bar">
        <SearchBar
          label="Courses"
          searchWord={search}
          setSearchWord={setSearch}
          onSearch={() => fetchCourses()}
        />

        <Select
          className="courses-select"
          value={selectedDifficulty}
          displayEmpty
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          renderValue={(selected) => {
            if (selected === -1)
              return (
                <span className="admin-placeholder">Filter by Difficulty</span>
              );

            return difficulties[Number(selected)];
          }}
        >
          <MenuItem value={-1}>All Difficulties</MenuItem>
          {difficulties.map((diff, idx) => (
            <MenuItem key={idx} value={idx}>
              {diff}
            </MenuItem>
          ))}
        </Select>

        <div className="sort-buttons">
          {renderSortButton("name", "Sort by Title")}
          {renderSortButton("rating", "Sort by Rating")}
        </div>
      </div>

      <div className="course-grid">
        {courses.map((course, ind) => (
          <CourseCard course={course} key={ind} />
        ))}
      </div>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Courses;
