import { FaBook, FaHome, FaQuestionCircle, FaTrophy, FaUserFriends } from 'react-icons/fa';
import { VscServerProcess } from "react-icons/vsc";
import { HiAcademicCap } from "react-icons/hi2";
import { IoIosChatboxes } from "react-icons/io";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import './LeftMenu.css';
import { getInfoFromToken } from '@/lib/jwt';

const userItems = [
    { type: 'divider', label: 'Platform' },
    { type: 'item', path: '/', label: 'Home', icon: <FaHome /> },
    { type: 'item', path: '/lessons', label: 'Lessons', icon: <FaBook /> },
    { type: 'item', path: '/challenges', label: 'Challenges', icon: <VscServerProcess /> },
    { type: 'item', path: '/courses', label: 'Courses', icon: <HiAcademicCap /> },
    { type: 'item', path: '/support', label: 'Support', icon: <IoIosChatboxes /> },
    { type: 'item', path: '/scoreboard', label: 'Leaderboard', icon: <FaTrophy /> },
];

const helperItems = [
    { type: 'divider', label: 'Helper' },
    { type: 'item', path: '/helper/questions', label: 'Questions', icon: <FaQuestionCircle /> }
];

const modItems = [
    { type: 'divider', label: 'Moderator' },
    { type: 'item', path: '/moderator/lessons', label: 'Lesson Studio', icon: <FaBook /> },
    { type: 'item', path: '/moderator/challenges', label: 'Challenge Studio', icon: <VscServerProcess /> },
    { type: 'item', path: '/moderator/courses', label: 'Course Studio', icon: <HiAcademicCap /> }
];

const adminItems = [
    { type: 'divider', label: 'Administrator' },
    { type: 'item', path: '/admin/users-roles', label: "Users' Roles", icon: <FaUserFriends /> }
];

const roles = ["User", "Helper", "Moderator", "Admin"];

function LeftMenu() {
    const location = useLocation();
    const auth = useAuth();

    const jwtToken = getInfoFromToken(auth?.token ?? null);

    const roleNum = roles.indexOf(jwtToken?.role ?? 'User');

    const menuItems = [
        ...userItems,
        ...(roleNum >= 1 ? helperItems : []),
        ...(roleNum >= 2 ? modItems : []),
        ...(roleNum >= 3 ? adminItems : []),
    ];

    return (
        <div className="left-menu">
            {menuItems.map((item, ind) => {
                if(item.type === 'divider')
                    return <div key={ind} className='left-menu-divider'>{item.label}</div>
                else
                    return <Link key={ind} to={item.path ?? '/'}><div className={`left-menu-item ${item.path === location.pathname ? 'left-menu-selected' : ''}`}>
                        {item.icon} {item.label}
                    </div></Link>
            })}
        </div>
    )
}

export default LeftMenu;