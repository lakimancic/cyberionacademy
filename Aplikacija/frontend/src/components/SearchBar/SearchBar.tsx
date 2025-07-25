import { FaSearch } from 'react-icons/fa';
import './SearchBar.css';

function SearchBar() {
    return <div className="search-bar-container">
        <input type="search" placeholder='Search Cyberion Academy' />
        <FaSearch />
    </div>
}

export default SearchBar;