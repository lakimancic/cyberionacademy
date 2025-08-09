import './Challenges.css';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Rating } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Switch from '@mui/material/Switch';



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
    hasSolved: boolean;
}

type SortKey = 'name' | 'points' | 'categoryName' | 'averageRating' | 'solvedCount';
type Tab = 'active' | 'retired' | 'all';

function Challenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('name');
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
     const [showUnsolvedOnly, setShowUnsolvedOnly] = useState(false);
    const difficultyLabels = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    const getDifficultyLabel = (value: number) => {
        return difficultyLabels[value] ?? 'Unknown';
    };
    const navigate = useNavigate();

    const pageSize = 8;

    useEffect(() => {
        fetchChallenges();
    }, [sortKey, sortDirection, activeTab, searchQuery, selectedCategory, selectedDifficulty, currentPage, showUnsolvedOnly]);

    useEffect(() => {
        api.get('/Challenge/GetCategories')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Greška pri dohvatanju kategorija', err));

        api.get('/Challenge/GetDifficulties')
            .then(res => setDifficulties(res.data))
            .catch(err => console.error('Greška pri dohvatanju težina', err));
    }, []);
    const fetchChallenges = () => {
        const archivedParam =
            activeTab === 'retired' ? true :
                activeTab === 'active' ? false :
                    undefined;

        const params: any = {
            sortKey,
            sortDirection,
            page: currentPage,
            pageSize,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: searchQuery !== '' ? searchQuery : undefined,
            archived: archivedParam,
            difficulty: selectedDifficulty !== '' ? Number(selectedDifficulty) : undefined,
            unsolvedOnly: showUnsolvedOnly ? true : undefined
        };
        console.log("Params sent to backend:", params);
        api.get('/Challenge/GetChallenges', { params })
            .then(response => {
                setChallenges(response.data.items);
                setTotalPages(response.data.totalPages);
            })
            .catch(error => console.error('Greška pri dohvatanju izazova:', error));
    };

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

    return (
        <div className="challenge-container">
            <h2 className="title">Challenges</h2>

            <div className="controls-bar">
                <div className="tabs">
                    {['all', 'active', 'retired'].map(tab => (
                        <button
                            key={tab}
                            className={`tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => {
                                setCurrentPage(1);
                                setActiveTab(tab as Tab);
                            }}>
                            {tab[0].toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white'}}>
          Show Unsolved Only
          <Switch
            checked={showUnsolvedOnly}
            onChange={e => {
              setCurrentPage(1);
              setShowUnsolvedOnly(e.target.checked);
            }}
            color="primary"
          />
        </label>

                <div className="controls">
                    <div className="search-group">
                        <input
                            type="text"
                            placeholder="Search Challenges..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && setSearchQuery(inputValue)}
                        />
                        <button onClick={() => {
                            setCurrentPage(1);
                            setSearchQuery(inputValue);
                        }}>🔎︎</button>
                    </div>


                    <select value={selectedCategory} onChange={e => {
                        setCurrentPage(1);
                        setSelectedCategory(e.target.value);
                    }}>
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select value={selectedDifficulty} onChange={e => {
                        setCurrentPage(1);
                        const value = e.target.value;
                        setSelectedDifficulty(value === '' ? '' : Number(value));
                    }}>
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
                        <th onClick={() => handleSort('name')}>Challenge {renderSortArrow('name')}</th>
                        <th onClick={() => handleSort('categoryName')}>Category {renderSortArrow('categoryName')}</th>
                        <th onClick={() => handleSort('points')}>Points {renderSortArrow('points')}</th>
                        <th onClick={() => handleSort('averageRating')}>Avg. Rating {renderSortArrow('averageRating')}</th>
                        <th onClick={() => handleSort('solvedCount')}>Users Solves {renderSortArrow('solvedCount')}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {challenges.map(c => (
                        <tr
                            key={c.id}
                            className={c.hasSolved ? 'solved' : ''}
                            onClick={() => navigate(`/challenges/${c.id}`)}
                        >
                            <td>
                                <div className="challenge-name">
                                    <strong>{c.name}</strong>
                                    {c.hasSolved && <span style={{ color: '#28a745', marginLeft: '6px' }}>✔</span>}
                                    <div className="difficulty">{getDifficultyLabel(c.difficulty)}</div>
                                </div>
                            </td>
                            <td>{c.categoryName}</td>
                            <td>{c.points}</td>
                            <td>
                                <Rating value={c.averageRating} precision={0.1} readOnly size="small" />
                            </td>
                            <td>{c.solvedCount}</td>
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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                    Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                    Next
                </button>
            </div>

        </div>
    );
}

export default Challenges;
