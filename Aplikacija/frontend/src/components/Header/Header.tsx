import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar/SearchBar';
import { Avatar } from '@mui/material';
import { FaAngleDown, FaAngleUp, FaUser, FaUserCheck } from 'react-icons/fa';
import { IoMdSettings } from 'react-icons/io';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { getInfoFromToken } from '@/lib/jwt';
import './Header.css';
import api from '@/lib/api';

function Header() {
    const [submenuVisible, setSubmenuVisible] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [avatarUrl, setAvatarUrl] = useState("");

    const jwtToken = getInfoFromToken(auth?.token ?? null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setSubmenuVisible(false);
            }
        }

        api.get("/Account/ProfilePicture", {
            responseType: 'blob'
        })
            .then(resp => {
                const url = URL.createObjectURL(resp.data);
                setAvatarUrl(url);
            });

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return (
        <header>
            <div className='header-left'>
                <Link to="/" className='title'>Cyberion<span>Academy</span></Link>
                <SearchBar />
            </div>
            <div className="header-right" onClick={() => setSubmenuVisible(!submenuVisible)} ref={dropdownRef}>
                <Avatar src={avatarUrl}></Avatar>
                <span className="name">{jwtToken?.username}</span>
                {submenuVisible ? <FaAngleUp /> : <FaAngleDown />}
                <div className={`header-submenu ${submenuVisible ? '' : 'header-hidden'}`}>
                    <Link to="/profile"><div className="header-subitem"><FaUser /> My Profile</div></Link>
                    <Link to="/settings"><div className="header-subitem"><IoMdSettings /> Account Settings</div></Link>
                    <Link to="/role-signup"><div className="header-subitem"><FaUserCheck /> Role Sign-up</div></Link>
                    <button type="button" className='logout-btn' onClick={() => {
                        auth?.logout();
                        navigate("/login");
                    }}>Logout</button>
                </div>
            </div>
        </header>
    )
}

export default Header;