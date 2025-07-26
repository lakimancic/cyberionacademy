import './Challenges.css';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Challenge {
    id: number;
    name: string;
    categoryName: string;
    points: number;
    autorName: string;
    createdAt: string;
    isArchived: boolean;
    isPublic: boolean;
    avatarUrl?: string;
}

type SortKey = keyof Challenge;
type Tab = 'active' | 'retired' | 'all';

function Challenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');

    useEffect(() => {
        api.get('/Challenge/GetChallenges')
            .then(response => setChallenges(response.data))
            .catch(error => console.error('Greška pri dohvatanju izazova:', error));
    }, []);

    const categoryOptions = Array.from(new Set(challenges.map(c => c.categoryName)));

    const filteredChallenges = challenges
        .filter(c => {
            if (activeTab === 'active') return !c.isArchived;
            if (activeTab === 'retired') return c.isArchived;
            return true;
        })
        .filter(c => selectedCategory === 'all' || c.categoryName === selectedCategory)
        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const sortedChallenges = [...filteredChallenges].sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (sortKey === 'createdAt') {
            const aDate = new Date(aValue as string).getTime();
            const bDate = new Date(bValue as string).getTime();
            return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }

        return 0;
    });

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

            <div className="tabs">
                {['all', 'active', 'retired'].map(tab => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab as Tab)}>
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
                <button onClick={() => setSearchQuery(inputValue)}>Search</button>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categoryOptions.map(cat => (
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
                        <th onClick={() => handleSort('createdAt')}>Date of creation{renderSortArrow('createdAt')}</th>
                        <th onClick={() => handleSort('autorName')}>Author {renderSortArrow('autorName')}</th>
                        <th ></th>
                    </tr>
                </thead>
                <tbody>
                    {sortedChallenges.map(c => (
                        <tr key={c.id}>
                            <td>
                                <div className="challenge-name">
                                    <strong>{c.name}</strong>
                                    <div className="difficulty">Very Easy</div>
                                </div>
                            </td>
                            <td>{c.categoryName}</td>
                            <td>{c.points}</td>
                            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div className="author">
                                    <img
                                        src={c.avatarUrl || 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'}
                                        alt="avatar"
                                    />
                                    <span>  {c.autorName}</span>
                                </div>
                            </td>
                            <button className="view-button">
                    ➔
                </button>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Challenges;
