import "./Lessons.css";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { MenuItem, Rating, Select, Switch } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/Table/DataTable";
import difficulties, { getColorHex } from "@/utils/difficulties";
import type { CategoryData } from "@/utils/categories";
import categoriesIcon from "@/utils/categories";
import SearchBar from "@/components/SearchBar/SearchBar";

interface Lesson {
  id: number;
  title: string;
  description?: string;
  difficulty: number;
  isPublic: boolean;
  categoryId: number;
  authorId: number;
  quizId?: number;
  categoryName: string;
  categoryShort: string;
  averageRating: number;
}

type SortKey = "title" | "categoryName" | "rating" | "difficulty";

function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [showWithQuiz, setShowWithQuiz] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/Categories/")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  const fetchLessons = () => {
    const params: any = {
      sortKey,
      sortDirection,
      page: currentPage,
      category: selectedCategory !== "" ? selectedCategory : undefined,
      search: searchQuery !== "" ? searchQuery : undefined,
      difficulty: selectedDifficulty !== -1 ? selectedDifficulty : undefined,
      quizOnly: showWithQuiz,
    };

    api
      .get("/Lesson/GetLessons", { params })
      .then((response) => {
        setLessons(response.data.items);
        setTotalPages(response.data.totalPages);
      })
      .catch(() => {
        setLessons([]);
        setTotalPages(1);
      });
  };

  useEffect(() => {
    fetchLessons();
  }, [
    sortKey,
    sortDirection,
    selectedCategory,
    selectedDifficulty,
    currentPage,
    showWithQuiz,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    sortKey,
    sortDirection,
    selectedCategory,
    selectedDifficulty,
    showWithQuiz,
  ]);

  const mappedLessons = useMemo(() => {
    return lessons.map((l) => {
      return {
        icon: (
          <img
            className="cat-icon"
            src={(categoriesIcon as any)[l.categoryShort]}
          />
        ),
        title: (
          <div className="challenge-name">
            <strong>{l.title}</strong>
          </div>
        ),
        difficulty: (
          <span style={{ color: getColorHex(l.difficulty) }}>
            {difficulties[l.difficulty] ?? "Unknown"}
          </span>
        ),
        categoryName: l.categoryName,
        rating: (
          <Rating
            value={l.averageRating}
            precision={0.1}
            readOnly
            size="small"
          />
        ),
        quiz: l.quizId ? `Yes` : "No",
        id: l.id,
      };
    });
  }, [lessons]);

  return (
    <div className="lesson-container">
      <h2 className="title">Lessons</h2>

      <div className="controls-bar">
        <div className="controls">
          <SearchBar
            label="Lessons"
            searchWord={searchQuery}
            setSearchWord={setSearchQuery}
            onSearch={() => {
              if (currentPage == 1) fetchLessons();
              setCurrentPage(1);
            }}
          />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "white",
          }}
        >
          Show with Quiz only
          <Switch
            checked={showWithQuiz}
            onChange={(e) => {
              setCurrentPage(1);
              setShowWithQuiz(e.target.checked);
            }}
            color="primary"
          />
        </label>
        <div className="controls">
          <Select
            value={selectedCategory}
            displayEmpty
            onChange={(e) => setSelectedCategory(e.target.value)}
            renderValue={(selected) => {
              if (selected.length === 0)
                return (
                  <span className="admin-placeholder">Filter by Category</span>
                );

              return selected;
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat, idx) => (
              <MenuItem key={idx} value={cat.name}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={selectedDifficulty}
            displayEmpty
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            renderValue={(selected) => {
              if (selected === -1)
                return (
                  <span className="admin-placeholder">
                    Filter by Difficulty
                  </span>
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
        </div>
      </div>

      <DataTable
        data={mappedLessons}
        columns={[
          { key: "icon", header: "" },
          { key: "title", header: "Lesson", sortable: true },
          { key: "categoryName", header: "Category", sortable: true },
          { key: "difficulty", header: "Difficulty", sortable: true },
          { key: "rating", header: "Avg. Rating", sortable: true },
          { key: "quiz", header: "Has Quiz " },
        ]}
        pagination={{
          page: currentPage,
          totalPages: totalPages,
          setPage: setCurrentPage,
        }}
        sort={{
          key: sortKey,
          dir: sortDirection,
          onSetSortDir: setSortDirection,
          onSetSortKey: (arg) => setSortKey(arg as SortKey),
        }}
        onRowClick={(row) => {
          navigate(`/lessons/${row.id}`);
        }}
      />
    </div>
  );
}

export default Lessons;
