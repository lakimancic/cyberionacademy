import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/Table/DataTable";
import difficulties from "@/utils/difficulties";
import { MenuItem, Rating, Select } from "@mui/material";
import api from "@/lib/api";
import SearchBar from "@/components/SearchBar/SearchBar";
import { useNavigate } from "react-router-dom";
import "@/assets/css/ModStudio.css";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useNotification } from "@/contexts/Notification/NotificationProvider";
import type { CategoryData } from "@/utils/categories";

interface Challenge {
  id: number;
  name: string;
  categoryName: string;
  points: number;
  averageRating: number;
  solvedCount: number;
  isArchived: boolean;
  isPublic: boolean;
  avatarUrl?: string;
  difficulty: number;
}

type SortKey = "name" | "points" | "categoryName";

function ChallengeStudio() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchWord, setSearchWord] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const navigate = useNavigate();
  const handleError = useErrorHandler();
  const { showNotification } = useNotification();

  useEffect(() => {
    api
      .get("/Categories")
      .then((res) => setCategories(res.data))
      .catch((err) => {
        handleError(err, (msg) => showNotification(msg, "error"));
      });
  }, []);

  const fetchChallenges = (searchQuery?: string) => {
    const params = {
      sortKey,
      sortDirection: sortDir,
      page: currentPage,
      search: searchQuery,
      category: selectedCategory !== "" ? selectedCategory : undefined,
      difficulty:
        selectedDifficulty !== "" ? Number(selectedDifficulty) : undefined,
      ownChalls: true,
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

  const onSearch = () => {
    fetchChallenges(searchWord);
  };

  useEffect(() => {
    fetchChallenges();
  }, [currentPage, sortKey, sortDir, selectedCategory, selectedDifficulty]);

  const mappedChallenges = useMemo(() => {
    return challenges.map((chal) => {
      return {
        name: (
          <div className="challenge-name">
            <strong>{chal.name}</strong>
            <div className="difficulty">
              {(difficulties as any)[chal.difficulty] ?? "Unknown"}
            </div>
          </div>
        ),
        categoryName: chal.categoryName,
        points: chal.points,
        rating: (
          <Rating
            value={chal.averageRating}
            precision={0.1}
            readOnly
            size="small"
          />
        ),
        sovleCount: chal.solvedCount,
        visible: chal.isPublic ? "Public" : "Private",
        status: chal.isArchived ? "Archived" : "Active",
        id: chal.id,
      };
    });
  }, [challenges]);

  return (
    <div className="studio-con">
      <h2>Create new or edit Challenges</h2>

      <div className="studio-con-filters">
        <button
          className="studio-con-add"
          onClick={() => {
            navigate("/moderator/new-challenge");
          }}
        >
          Add New Challenge
        </button>
        <div className="studio-con-right">
          <SearchBar
            label="Challenges"
            searchWord={searchWord}
            setSearchWord={setSearchWord}
            onSearch={onSearch}
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
              if (selected.length === 0)
                return (
                  <span className="admin-placeholder">
                    Filter by Difficulty
                  </span>
                );

              return difficulties[Number(selected)];
            }}
          >
            <MenuItem value="">All Difficulties</MenuItem>
            {difficulties.map((diff, idx) => (
              <MenuItem key={idx} value={idx}>
                {diff}
              </MenuItem>
            ))}
          </Select>
        </div>
      </div>

      <DataTable
        className="studio-con-table"
        data={mappedChallenges}
        columns={[
          { key: "name", header: "Challenge", sortable: true },
          { key: "categoryName", header: "Category", sortable: true },
          { key: "points", header: "Points", sortable: true },
          { key: "rating", header: "Avg. Rating" },
          { key: "sovleCount", header: "Users Solves" },
          { key: "visible", header: "Visibility" },
          { key: "status", header: "Status" },
        ]}
        pagination={{
          page: currentPage,
          totalPages: totalPages,
          setPage: setCurrentPage,
        }}
        sort={{
          key: sortKey,
          dir: sortDir,
          onSetSortDir: setSortDir,
          onSetSortKey: (arg) => setSortKey(arg as SortKey),
        }}
        onRowClick={(row) => {
          navigate(`/moderator/edit-challenge/${row.id}`);
        }}
      />
    </div>
  );
}

export default ChallengeStudio;
