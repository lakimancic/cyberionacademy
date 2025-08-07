import './Courses.css';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Avatar, Rating } from '@mui/material';
import AuthImage from '@/components/AuthImage/AuthImage';

interface Course {
  id: number;
  title: string;
  description?: string;
  autorName?: string;
  autorId?: number;
  averageRating: number;
  difficulty: number;
}

type ImageWrapperProps = React.ImgHTMLAttributes<HTMLImageElement>;

const ImageWrapper: React.FC<ImageWrapperProps> = ({ src, alt = '', ...props }) => {
  return <img src={src===""?undefined:src} alt={alt} {...props} />;
};

function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sortKey, setSortKey] = useState<'name' | 'rating'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [difficulties, setDifficulties] = useState<{ value: number; label: string }[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 9;

  useEffect(() => {
    api.get('/Course/GetDifficulties')
      .then(res => setDifficulties(res.data))
      .catch(err => console.error('Greška pri dohvatanju težina', err));
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [sortKey, sortDirection, search, selectedDifficulty, currentPage]);

  const fetchCourses = () => {
    const params: any = {
      sortKey,
      sortDirection,
      page: currentPage,
      pageSize,
      search: search !== '' ? search : undefined,
      difficulty: selectedDifficulty !== '' ? Number(selectedDifficulty) : undefined
    };

    api.get('/Course/GetCourses', { params })
      .then(res => {
        setCourses(res.data.items);
        setTotalPages(res.data.totalPages);
        console.log(res)
      })
      .catch(err => console.error('Greška pri dohvatanju kurseva', err));
  };

  const renderSortButton = (key: 'name' | 'rating', label: string) => (
    <button
      className={`sort-button ${sortKey === key ? 'active' : ''}`}
      onClick={() => {
        if (sortKey === key) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setSortKey(key);
          setSortDirection('asc');
        }
      }}>
      {label} {sortKey === key ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
    </button>
  );

  return (
    <div className="courses-container">
      <h2 className="title">Courses</h2>

      <div className="controls-bar">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search Courses..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(inputValue)}
          />
          <button onClick={() => {
            setCurrentPage(1);
            setSearch(inputValue);
          }}>🔍</button>
        </div>

        <select
          value={selectedDifficulty}
          onChange={e => {
            setCurrentPage(1);
            const value = e.target.value;
            setSelectedDifficulty(value === '' ? '' : Number(value));
          }}>
          <option value="">All Difficulties</option>
          {difficulties.map(diff => (
            <option key={diff.value} value={diff.value}>{diff.label}</option>
          ))}
        </select>

        <div className="sort-buttons">
          {renderSortButton('name', 'Sort by Title')}
          {renderSortButton('rating', 'Sort by Rating')}
        </div>
      </div>

      <div className="course-grid">
        {courses.map(course => (
          <div className="course-card" key={course.id}>
            <AuthImage src={`/Course/${course.id}/Banner`} element={ImageWrapper}/>
            <div className="course-content">
              <h3>{course.title}</h3>
              <div className="difficulty">{difficulties.find(d => d.value === course.difficulty)?.label}</div>
              <div className="author">
                <AuthImage src={`/user/${course.autorId}/ProfilePicture`} element={Avatar}/>
                <span>{course.autorName ?? 'Unknown Author'}</span>
              </div>
              <Rating
                value={course.averageRating}
                precision={0.1}
                readOnly
                size="small"
                className='rating-bottom-left'
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>Next</button>
      </div>
    </div>
  );
}

export default Courses;
