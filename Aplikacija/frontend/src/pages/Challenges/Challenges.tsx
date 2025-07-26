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

    const renderSortArrow = (key: SortKey) => {
        if (sortKey !== key) return null;
        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };

    useEffect(() => {
        api.get('/Challenge/GetChallenges')
            .then(response => {
                setChallenges(response.data);
            })
            .catch(error => console.error('Greška pri dohvatanju izazova:', error));
    }, []);

    const filteredChallenges = challenges.filter((c) => {
        if (activeTab === 'active') return !c.isArchived;
        if (activeTab === 'retired') return c.isArchived;
        return true;
    });

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
            <h2>Lista Izazova</h2>

            <div className="tabs">
                <button
                    className={activeTab === 'all' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('all')}>
                    All Challenges
                </button>
                <button
                    className={activeTab === 'active' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('active')}>
                    Active
                </button>
                <button
                    className={activeTab === 'retired' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('retired')}>
                    Retired
                </button>
            </div>

            <table className="challenge-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')}>Name{renderSortArrow('name')}</th>
                        <th onClick={() => handleSort('categoryName')}>Category{renderSortArrow('categoryName')}</th>
                        <th onClick={() => handleSort('points')}>Points{renderSortArrow('points')}</th>
                        <th onClick={() => handleSort('createdAt')}>Date of creation{renderSortArrow('createdAt')}</th>
                        <th onClick={() => handleSort('autorName')}>Author{renderSortArrow('autorName')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedChallenges.map((challenge) => (
                        <tr key={challenge.id}>
                            <td>{challenge.name}</td>
                            <td>{challenge.categoryName}</td>
                            <td>{challenge.points}</td>
                            <td>{new Date(challenge.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <img
                                        src={
                                            challenge.avatarUrl ||
                                            'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'
                                        }
                                        alt="avatar"
                                        width="24"
                                        height="24"
                                        style={{ borderRadius: '50%' }}
                                    />
                                    <span>{challenge.autorName}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Challenges;
