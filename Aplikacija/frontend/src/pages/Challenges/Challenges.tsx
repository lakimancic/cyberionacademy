import './Challenges.css';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

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
}

type SortKey = 'name' | 'points' | 'categoryName';
type Tab = 'active' | 'retired' | 'all';

function Challenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const pageSize = 10;

    useEffect(() => {
        fetchChallenges();
    }, [sortKey, sortDirection, activeTab, searchQuery, selectedCategory, currentPage]);

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
            archived: archivedParam
        };

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

    const uniqueCategories = Array.from(new Set(challenges.map(c => c.categoryName)));

    return (
        <div className="challenge-container">
            <h2 className="title">Challenges</h2>

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

            <div className="controls">
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
                }}>Search</button>

                <select value={selectedCategory} onChange={e => {
                    setCurrentPage(1);
                    setSelectedCategory(e.target.value);
                }}>
                    <option value="all">All Categories</option>
                    {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <select value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)}>
                    <option value="">All Difficulties</option>
                </select>
            </div>

            <table className="challenge-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')}>Challenge {renderSortArrow('name')}</th>
                        <th onClick={() => handleSort('categoryName')}>Category {renderSortArrow('categoryName')}</th>
                        <th onClick={() => handleSort('points')}>Points {renderSortArrow('points')}</th>
                        <th>Avg. Rating</th>
                        <th>Solved</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {challenges.map(c => (
                        <tr key={c.id}>
                            <td>
                                <div className="challenge-name">
                                    <strong>{c.name}</strong>
                                    <div className="difficulty">Very Easy</div>
                                </div>
                            </td>
                            <td>{c.categoryName}</td>
                            <td>{c.points}</td>
                            <td>{c.averageRating.toFixed(2)} ★</td>
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
