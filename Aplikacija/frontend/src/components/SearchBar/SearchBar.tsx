import { FaSearch } from 'react-icons/fa';
import './SearchBar.css';

type Props = {
    label: string;
    setSearchWord?: (prev: React.SetStateAction<string>) => void;
    searchWord?: string;
    onSearch?: () => void;
};

function SearchBar({ label, searchWord, setSearchWord, onSearch } : Props) {
    return <div className="search-bar-container">
        <input 
            type="search"
            placeholder={`Search ${label}`}
            value={searchWord}
            onChange={e => setSearchWord?.(e.target.value)}
        />
        <FaSearch onClick={() => onSearch?.()} />
    </div>
}

export default SearchBar;