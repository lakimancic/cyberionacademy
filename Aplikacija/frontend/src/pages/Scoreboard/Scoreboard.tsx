import { useEffect, useState } from 'react';
import DataTable from '@/components/Table/DataTable';
import gold from '@/assets/images/ranks/gold.png';
import silver from '@/assets/images/ranks/silver.png';
import bronze from '@/assets/images/ranks/bronze.png';
import './Scoreboard.css';
import AuthImage from '@/components/AuthImage/AuthImage';
import { Avatar } from '@mui/material';
import api from '@/lib/api';

type UserData = {
    rankNum: number;
    rank: string;
    username: string;
    country?: string;
    id: number;
    totalPoints: number;
};

const thropies = [gold, silver, bronze];

function Scoreboard() {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [users, setUsers] = useState<UserData[]>([]);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        setCurrentPage(1);

        api.get("/Scoreboard/")
            .then(resp => {
                setTotalPages(resp.data.totalPages);
                setUsers(resp.data.users);
            });
    }, []);

    return (
        <div className="scoreboard">
            <h1>Cyberion<span>Leaderboard</span></h1>
            <div className="scoreboard-tabs">
                <div className="scoreboard-tab" onClick={() => setTab(0)}>Users Ranking</div>
                <div className="scoreboard-tab" onClick={() => setTab(1)}>Countries Ranking</div>
                <div 
                    className="scoreboard-tab-active"
                    style={{ left: `${13.3 + 43.3 * tab}%`}}  
                ></div>
            </div>
            <div className="scoreboard-content">
                <DataTable 
                    data={users.map(user => {
                        return {
                            ranking: <div className='score-ranking'>
                                {user.rankNum <= 3 ? <img src={thropies[user.rankNum - 1]} /> : `#${user.rankNum}`}
                            </div>,
                            user: <div className='score-user'>
                                <AuthImage src={`/User/${user.id}/ProfilePicture`} element={Avatar} />
                                {user.username}
                            </div>,
                            rank: <div className="score-rank">
                                {user.rank}
                            </div>,
                            points: <div className="score-points">
                                {user.totalPoints}pts
                            </div>
                        }
                    })}
                    columns={[
                        { key: 'ranking', header: '#'},
                        { key: 'user', header: 'User' },
                        { key: 'rank', header: 'Rank' },
                        { key: 'points', header: 'Points' }
                    ]}
                    pagination={{
                        page: currentPage,
                        totalPages: totalPages,
                        setPage: setCurrentPage
                    }}
                />
            </div>
        </div>
    )
}

export default Scoreboard;