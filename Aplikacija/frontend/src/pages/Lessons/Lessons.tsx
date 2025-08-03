import './Lessons.css';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Rating } from '@mui/material';
import { useNavigate } from 'react-router-dom';

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
  averageRating: number;
}

type SortKey = 'title' | 'categoryName';
type Tab = 'all' | 'public' | 'private';

function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<{ value: number; label: string }[]>([]);
  const navigate = useNavigate();
  const pageSize = 8;
  const difficultyLabels = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];

  useEffect(() => {
    api.get('/Lesson/GetCategories')
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]));

    api.get('/Lesson/GetDifficulties')
      .then(res => setDifficulties(res.data))
      .catch(() => setDifficulties([]));
  }, []);

  useEffect(() => {
    const publicParam =
      activeTab === 'public' ? true :
      activeTab === 'private' ? false :
      undefined;

    const params: any = {
      sortKey,
      sortDirection,
      page: currentPage,
      pageSize,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchQuery !== '' ? searchQuery : undefined,
      isPublic: publicParam,
      difficulty: selectedDifficulty !== '' ? Number(selectedDifficulty) : undefined,
    };

    api.get('/Lesson/GetLessons', { params })
      .then(response => {
        setLessons(response.data.items);
        setTotalPages(response.data.totalPages);
      })
      .catch(() => {
        setLessons([]);
        setTotalPages(1);
      });
  }, [sortKey, sortDirection, activeTab, searchQuery, selectedCategory, selectedDifficulty, currentPage]);

  const renderSortArrow = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getDifficultyLabel = (value: number) => difficultyLabels[value] ?? 'Unknown';

  return (
    <div className="challenge-container">
      <h2 className="title">Lessons</h2>

      <div className="controls-bar">
        <div className="tabs">
          {['all', 'public', 'private'].map(tab => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setCurrentPage(1);
                setActiveTab(tab as Tab);
              }}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="controls">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search Lessons..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearchQuery(inputValue)}
            />
            <button
              onClick={() => {
                setCurrentPage(1);
                setSearchQuery(inputValue);
              }}
            >
              🔎︎
            </button>
          </div>

          <select
            value={selectedCategory}
            onChange={e => {
              setCurrentPage(1);
              setSelectedCategory(e.target.value);
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={e => {
              setCurrentPage(1);
              const value = e.target.value;
              setSelectedDifficulty(value === '' ? '' : Number(value));
            }}
          >
            <option value="">All Difficulties</option>
            {difficulties.map(diff => (
              <option key={diff.value} value={diff.value}>
                {diff.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className="challenge-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('title')}>Lesson {renderSortArrow('title')}</th>
            <th onClick={() => handleSort('categoryName')}>Category {renderSortArrow('categoryName')}</th>
            <th>Difficulty</th>
            <th>Rating</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lessons.map(lesson => (
            <tr key={lesson.id} onClick={() => navigate(`/lessons/${lesson.id}`)}>
              <td>
                <div className="challenge-name">
                  <strong>{lesson.title}</strong>
                </div>
              </td>
              <td>{lesson.categoryName}</td>
              <td>{getDifficultyLabel(lesson.difficulty)}</td>
              <td>
                <Rating value={lesson.averageRating} precision={0.1} readOnly size="small" />
              </td>
              <td>
                <button className="view-button">➔</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Lessons;
