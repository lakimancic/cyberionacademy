import "./Challenges.css";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { MenuItem, Rating, Select } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Switch from "@mui/material/Switch";
import categoriesIcon, { type CategoryData } from "@/utils/categories";
import difficulties, { getColorHex } from "@/utils/difficulties";
import DataTable from "@/components/Table/DataTable";
import { IoPeople } from "react-icons/io5";
import SearchBar from "@/components/SearchBar/SearchBar";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useNotification } from "@/contexts/Notification/NotificationProvider";

interface Challenge {
  id: number;
  name: string;
  categoryName: string;
  categoryShort: string;
  points: number;
  averageRating: number;
  solvedCount: number;
  isArchived: boolean;
  isPublic: boolean;
  avatarUrl?: string;
  difficulty: number;
  hasSolved: boolean;
}

type SortKey =
  | "name"
  | "points"
  | "categoryName"
  | "averageRating"
  | "solvedCount";
type Tab = "active" | "archived" | "all";

function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [showUnsolvedOnly, setShowUnsolvedOnly] = useState(false);
  const handleError = useErrorHandler();
  const { showNotification } = useNotification();

  const navigate = useNavigate();

  const pageSize = 8;

  useEffect(() => {
    fetchChallenges();
  }, [
    sortKey,
    sortDirection,
    activeTab,
    selectedCategory,
    selectedDifficulty,
    currentPage,
    showUnsolvedOnly,
  ]);

  useEffect(() => {
    api
      .get("/Categories/")
      .then((res) => setCategories(res.data))
      .catch((err) => {
        handleError(err, (msg) => showNotification(msg, "error"));
      });
  }, []);

  const fetchChallenges = () => {
    const archivedParam =
      activeTab === "archived"
        ? true
        : activeTab === "active"
        ? false
        : undefined;

    const params: any = {
      sortKey,
      sortDirection,
      page: currentPage,
      pageSize,
      category: selectedCategory !== "" ? selectedCategory : undefined,
      search: searchQuery !== "" ? searchQuery : undefined,
      archived: archivedParam,
      difficulty:
        selectedDifficulty !== -1 ? Number(selectedDifficulty) : undefined,
      unsolvedOnly: showUnsolvedOnly ? true : undefined,
    };

    api
      .get("/Challenge/GetChallenges", { params })
      .then((response) => {
        setChallenges(response.data.items);
        setTotalPages(response.data.totalPages);
      })
      .catch((error) => {
        handleError(error, (msg) => showNotification(msg, "error"));
      });
  };

  const mappedChallenges = useMemo(() => {
    return challenges.map((c) => {
      return {
        icon: (
          <img
            className="cat-icon"
            src={(categoriesIcon as any)[c.categoryShort]}
          />
        ),
        name: (
          <div className="challenge-name">
            <strong>{c.name}</strong>
            {c.hasSolved && (
              <span style={{ color: "#28a745", marginLeft: "6px" }}>✔</span>
            )}
            <div className="difficulty">
              {difficulties[c.difficulty] ?? "Unknown"}
            </div>
          </div>
        ),
        difficulty: (
          <span style={{ color: getColorHex(c.difficulty) }}>
            {difficulties[c.difficulty] ?? "Unknown"}
          </span>
        ),
        points: (
          <span style={{ opacity: c.isArchived ? 0.3 : 1 }}>{c.points}</span>
        ),
        status: c.isArchived ? "Archived" : "Active",
        categoryName: c.categoryName,
        solvedCount: (
          <span className="people-solve">
            <IoPeople /> {c.solvedCount}
          </span>
        ),
        averageRating: (
          <Rating
            value={c.averageRating}
            precision={0.1}
            readOnly
            size="small"
          />
        ),
        id: c.id,
        solved: c.hasSolved,
      };
    });
  }, [challenges]);

  return (
    <div className="challenge-container">
      <h2 className="title">Challenges</h2>

      <div className="controls-bar">
        <div className="tabs">
          {["all", "active", "archived"].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setCurrentPage(1);
                setActiveTab(tab as Tab);
              }}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "white",
          }}
        >
          Show Unsolved Only
          <Switch
            checked={showUnsolvedOnly}
            onChange={(e) => {
              setCurrentPage(1);
              setShowUnsolvedOnly(e.target.checked);
            }}
            color="primary"
          />
        </label>

        <div className="controls">
          <SearchBar
            label="Challenges"
            searchWord={searchQuery}
            setSearchWord={setSearchQuery}
            onSearch={() => fetchChallenges()}
          />
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
        data={mappedChallenges}
        className="challenge-table"
        columns={[
          { key: "icon", header: "" },
          { key: "name", header: "Challenge", sortable: true },
          { key: "categoryName", header: "Category", sortable: true },
          { key: "points", header: "Points", sortable: true },
          { key: "averageRating", header: "Avg. Rating", sortable: true },
          { key: "solvedCount", header: "Users Solved", sortable: true },
          { key: "status", header: "Status" },
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
          navigate(`/challenges/${row.id}`);
        }}
        rowClass={(row) => {
          return row.solved ? "solved" : "";
        }}
      />
    </div>
  );
}

export default Challenges;
