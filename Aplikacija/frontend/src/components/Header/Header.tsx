import { createSearchParams, Link, useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar/SearchBar';
import { Avatar } from '@mui/material';
import { FaAngleDown, FaAngleUp, FaUser, FaUserCheck } from 'react-icons/fa';
import { IoMdSettings } from 'react-icons/io';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { getInfoFromToken } from '@/lib/jwt';
import AuthImage from '../AuthImage/AuthImage';
import './Header.css';

function Header() {
    const [submenuVisible, setSubmenuVisible] = useState(false);
    const auth = useAuth();
    const [searchWord, setSearchWord] = useState('');

    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const jwtToken = getInfoFromToken(auth?.token ?? null);

    const onSearch = (tag?: String) => {
        const params: any = {};
        if (tag)
            params["type"] = tag;
        params["search"] = searchWord;

        navigate({
            pathname: '/search',
            search: createSearchParams(params).toString()
        })
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setSubmenuVisible(false);
            }
        }

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return (
        <header>
            <div className='header-left'>
                <Link to="/" className='title'>Cyberion<span>Academy</span></Link>
                <SearchBar 
                    label='Cyberion Academy' 
                    tags={[
                        { name: 'user', label: 'Users' },
                        { name: 'course', label: 'Courses' },
                        { name: 'challenge', label: 'Challenges' },
                        { name: 'lesson', label: 'Lessons' }
                    ]}
                    searchWord={searchWord}
                    setSearchWord={setSearchWord}
                    onSearch={onSearch}
                />
            </div>
            <div className="header-right" onClick={() => setSubmenuVisible(!submenuVisible)} ref={dropdownRef}>
                <AuthImage src="/Account/ProfilePicture" element={Avatar} />
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