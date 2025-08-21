import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Avatar } from '@mui/material';
import api from '@/lib/api';
import worldLogo from '@/assets/images/world.png';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { ActivityCalendar } from 'react-activity-calendar';
import './User.css';
import { LineChart } from '@mui/x-charts';
import badges from '@/utils/badges';

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
    badges: {
        short: string;
        name: string;
    }[]
};

type ChallengeRadarData = {
    name: string;
    max: number;
    num: number;
};

type ActivityData = {
    count: number;
    date: string;
};

type GrowthData = {
    year: number;
    month: number;
    totalPoints: number;
};

function User() {
    const { userId } = useParams();
    const [userInfo, setUserInfo] = useState<UserInfo|null>(null);
    const [userStats, setUserStats] = useState<UserStats|null>(null);
    const [growthData, setGrowthData] = useState<GrowthData[]>([]);
    const [chalRadarData, setChalRadarData] = useState<ChallengeRadarData[]>([]);
    const [quizRadarData, setQuizRadarData] = useState<ChallengeRadarData[]>([]);
    const [activity, setActivity] = useState<ActivityData[]>([]);
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

        api.get(`/User/${userId}/ChallengesInfo`)
            .then(resp => {
                setChalRadarData(resp.data);
            });

        api.get(`/User/${userId}/LessonsInfo`)
            .then(resp => {
                setQuizRadarData(resp.data);
            });

        api.get(`/User/${userId}/PointsPerMonth`)
            .then(resp => {
                const monthsData : GrowthData[] = resp.data.monthsData;
                let startPoints = resp.data.totalPoints;

                monthsData.reverse();
                monthsData.forEach(val => {
                    let tmpts = startPoints;
                    startPoints -= val.totalPoints;
                    val.totalPoints = tmpts;
                });
                monthsData.reverse();

                setGrowthData(monthsData);
            });

        api.get(`/User/${userId}/Activity`)
            .then(resp => {
                setActivity(resp.data);
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
                            src={userInfo?.country ? `https://flagcdn.com/w160/${userInfo.country}.png` : undefined}
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
            {((userStats?.badges.length ?? 0) > 0) && 
            <div className='user-badges'>
                <h2>User Badges</h2>
                <div className="user-badges-grid">
                    {userStats?.badges.map((badge, i) => (
                        <div className="user-badge" key={i}>
                            <img src={(badges as any)[badge.short]} />
                            <div className="user-badge-name">{badge.name}</div>
                        </div>
                    ))}
                </div>
            </div>}
            <div className="user-year-stats">
                <h2>User Activity & Growth Last year</h2>
                {activity.length > 0 && <ActivityCalendar 
                    data={activity.map(a => {
                        return { 
                            date: a.date.split('T')[0],
                            count: a.count,
                            level: Math.min(4, Math.ceil(a.count / 3))
                        }
                    })} 
                    weekStart={0}
                    theme={{
                        light: ['#f0f0f0', '#f0f0f0', '#f0f0f0', '#f0f0f0', '#f0f0f0'],
                        dark: ['#181d30ff', '#232e58ff', '#30428aff', '#344dafff', '#2c52ebff'],
                    }}
                    colorScheme='dark'
                />}
                <LineChart
                    dataset={growthData.map(gd => { 
                        return { yearMonth: `${gd.month}/${gd.year}`, points: gd.totalPoints }
                    })}
                    xAxis={[{ scaleType: 'band', dataKey: 'yearMonth' }]}
                    series={[{ dataKey: 'points' }]}
                    width={900}
                    height={300}
                    grid={{ vertical: true, horizontal: true }}
                />
            </div>
            <div className="user-radars">
                <div className="user-radar">
                    <h2>Challenges Stats</h2>
                    <RadarChart
                        height={400}
                        series={[{ label: 'Challenges', data: chalRadarData.map(c => c.num)}]}
                        radar={{
                            metrics: chalRadarData.map(c => {
                                return {name: c.name, max: c.max};
                            }),
                        }}
                    />
                </div>
                <div className="user-radar">
                    <h2>Lessons (Quizes) Stats</h2>
                    <RadarChart
                        height={400}
                        series={[{ label: 'Lessons (Quizes)', data: quizRadarData.map(c => c.num), color: '#34be7eff'}]}
                        radar={{
                            metrics: quizRadarData.map(c => {
                                return {name: c.name, max: c.max};
                            }),
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default User;