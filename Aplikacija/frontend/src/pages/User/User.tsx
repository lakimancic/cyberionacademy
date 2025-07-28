import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Avatar, createTheme, ThemeProvider } from '@mui/material';
import api from '@/lib/api';
import worldLogo from '@/assets/images/world.png';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import { RadarChart } from '@mui/x-charts/RadarChart';
import './User.css';

type UserInfo = {
    id: number;
    username: string;
    fullName: string;
    bio?: string;
    role: string;
    country?: string;
};

type UserStats = {
    points: number;
    rankName: string;
    rankNum: number;
};

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

function User() {
    const { userId } = useParams();
    const [userInfo, setUserInfo] = useState<UserInfo|null>(null);
    const [userStats, setUserStats] = useState<UserStats|null>(null);
    const profilePicture = useProfilePicture(userId ?? '0');

    useEffect(() => {
        api.get(`/User/${userId}/Info`)
            .then(resp => {
                setUserInfo(resp.data);
            });

        api.get(`/User/${userId}/Stats`)
            .then(resp => {
                setUserStats(resp.data);
            });
    }, []);

    return (
        <div className="user-page">
            <div className="user-main">
                <div className="user-info">
                    <div className="user-avatar">
                        <Avatar 
                            className='user-profile'
                            src={profilePicture.avatarUrl}
                        />
                        <Avatar 
                            className='user-flag'
                            src={`https://flagcdn.com/w160/${userInfo?.country}.png`}
                        >
                            <img src={worldLogo} className='user-world'/>
                        </Avatar>
                    </div>
                    <div className="user-text">
                        <p className={`user-role-${userInfo?.role.toLocaleLowerCase()}`}>{userInfo?.role}</p>
                        <h2 className="user-username">{userInfo?.username}</h2>
                        <p className="user-fullname">Full Name: <span>{userInfo?.fullName}</span></p>
                        <p className="user-bio">{
                            userInfo?.bio ? <><span>Bio:</span>{userInfo.bio}</> : <span>No bio</span>
                        }</p>
                    </div>
                </div>
                <div className="user-stats">
                    <p className="user-rank-label">Rank</p>
                    <h2 className='user-rank'>{userStats?.rankName}</h2>
                    <h3 className='user-points'>{userStats?.points}pts</h3>
                    <p className="user-ranking">Ranking #{userStats?.rankNum}</p>
                </div>
            </div>
            <ThemeProvider theme={darkTheme}>
                <RadarChart
                    height={300}
                    series={[{ label: 'Lisa', data: [120, 98, 86, 99, 85, 65] }]}
                    radar={{
                        max: 120,
                        metrics: ['Math', 'Chinese', 'English', 'Geography', 'Physics', 'History'],
                    }}
                />
            </ThemeProvider> 
        </div>
    )
}

export default User;