import '@/assets/css/ModStudio.css';
import SearchBar from '@/components/SearchBar/SearchBar';
import DataTable from '@/components/Table/DataTable';
import { useNotification } from '@/contexts/Notification/NotificationProvider';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import api from '@/lib/api';
import difficulties from '@/utils/difficulties';
import { MenuItem, Rating, Select } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Course {
    id: number;
    title: string;
    averageRating: number;
    difficulty: number;
    hasBanner: boolean;
}

type SortKey = 'name' | 'rating';

function CourseStudio() {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchWord, setSearchWord] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
    const navigate = useNavigate();
    const handleError = useErrorHandler();
    const { showNotification } = useNotification();

    const fetchCourses = (searchQuery?: string) => {
        const params = {
            sortKey,
            sortDirection: sortDir,
            page: currentPage,
            search: searchQuery,
            difficulty: selectedDifficulty !== '' ? Number(selectedDifficulty) : undefined,
            ownCourses: true
        };

        api.get('/Course/GetCourses', { params })
            .then(response => {
                setCourses(response.data.items);
                setTotalPages(response.data.totalPages);
            })
            .catch(error => {
                handleError(error, msg => showNotification(msg, 'error'));
            });
    };

    const onSearch = () => {
        fetchCourses(searchWord);
    };

    useEffect(() => {
        fetchCourses();
    }, [currentPage, sortKey, sortDir, selectedDifficulty]);

    const mappedCourses = useMemo(() => {
        return courses.map(course => {
            return {
                name: <div className='challenge-name'>
                    <strong>{course.title}</strong>
                </div>,
                difficulty: 
                    <div className="lone-difficulty">{(difficulties as any)[course.difficulty] ?? 'Unknown'}</div>,
                rating: <Rating 
                    value={course.averageRating}
                    precision={0.1}
                    readOnly
                    size="small"
                />,
                hasBanner: course.hasBanner ? 'Yes' : 'No',
                id: course.id,
            }
        })
    }, [courses]);

    return (
        <div className="studio-con">
            <h2>Create new or edit Courses</h2>

            <div className="studio-con-filters">
                <button
                    className='studio-con-add'
                    onClick={() => {
                        navigate("/moderator/new-course")
                    }}
                >Add New Course</button>
                <div className="studio-con-right">
                    <SearchBar 
                        label='Courses'
                        searchWord={searchWord}
                        setSearchWord={setSearchWord}
                        onSearch={onSearch}
                    />
                    <Select
                        value={selectedDifficulty}
                        displayEmpty
                        onChange={e => setSelectedDifficulty(e.target.value)}
                        renderValue={selected => {
                            if(selected.length === 0)
                                return <span className='admin-placeholder'>Filter by Difficulty</span>;

                            return difficulties[Number(selected)];
                        }}
                        >
                            <MenuItem value=''>All Difficulties</MenuItem>
                            {difficulties.map((diff, idx) => (<MenuItem key={idx} value={idx}>
                                {diff}
                            </MenuItem>))}
                    </Select>
                </div>
            </div>

            <DataTable 
                className='studio-con-table'
                data={mappedCourses}
                columns={[
                    { key: 'name', header: 'Course Title', sortable: true },
                    { key: 'difficulty', header: 'Difficulty' },
                    { key: 'rating', header: 'Avg. Rating', sortable: true },
                    { key: 'hasBanner', header: 'Has Banner' },
                ]}
                pagination={{
                    page: currentPage,
                    totalPages: totalPages,
                    setPage: setCurrentPage
                }}
                sort={{
                    key: sortKey,
                    dir: sortDir,
                    onSetSortDir: setSortDir,
                    onSetSortKey: arg => setSortKey(arg as SortKey)
                }}
                onRowClick={row => {
                    navigate(`/moderator/edit-course/${row.id}`);
                }}
            />
        </div>
    )
}

export default CourseStudio;