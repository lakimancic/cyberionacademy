import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/Table/DataTable';
import difficulties from '@/utils/difficulties';
import { MenuItem, Rating, Select } from '@mui/material';
import api from '@/lib/api';
import SearchBar from '@/components/SearchBar/SearchBar';
import { useNavigate } from 'react-router-dom';
import '@/assets/css/ModStudio.css';

interface Lesson {
  id: number;
  title: string;
  description?: string;
  difficulty: number;
  isPublic: boolean;
  categoryId: number;
  authorId: number;
  quizId?: number;
  categoryName: string;
  averageRating: number;
}

type SortKey = 'name' | 'categoryName';

function LessonStudio() {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [searchWord, setSearchWord] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
    const [categories, setCategories] = useState<string[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/Challenge/GetCategories')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Greška pri dohvatanju kategorija', err));
    }, []);

    const fetchChallenges = (searchQuery?: string) => {
        const params = {
            sortKey,
            sortDirection: sortDir,
            page: currentPage,
            search: searchQuery,
            category: selectedCategory !== '' ? selectedCategory : undefined,
            difficulty: selectedDifficulty !== '' ? Number(selectedDifficulty) : undefined
        };

        api.get('/Lesson/GetLessons', { params })
            .then(response => {
                setLessons(response.data.items);
                setTotalPages(response.data.totalPages);
            })
            .catch(error => console.error('Greška pri dohvatanju izazova:', error));
    };

    const onSearch = () => {
        fetchChallenges(searchWord);
    };

    useEffect(() => {
        fetchChallenges();
    }, [currentPage, sortKey, sortDir, selectedCategory, selectedDifficulty]);

    const mappedLessons = useMemo(() => {
        return lessons.map(l => {
            return {
                name: <div className='challenge-name'>
                    <strong>{l.title}</strong>
                    <div className="difficulty">{(difficulties as any)[l.difficulty] ?? 'Unknown'}</div>
                </div>,
                categoryName: l.categoryName,
                rating: <Rating 
                    value={l.averageRating}
                    precision={0.1}
                    readOnly
                    size="small"
                />,
                quiz: l.quizId ? `Quiz #${l.quizId}` : 'No quiz',
                visible: l.isPublic ? 'Public' : 'Private',
                id: l.id
            }
        })
    }, [lessons]);

    return (
        <div className="studio-con">
            <h2>Create new or edit Lessons</h2>

            <div className="studio-con-filters">
                <button
                    className='studio-con-add'
                    onClick={() => {
                        navigate("/moderator/new-lesson")
                    }}
                >Add New Lesson</button>
                <div className="studio-con-right">
                    <SearchBar 
                        label='Lessons'
                        searchWord={searchWord}
                        setSearchWord={setSearchWord}
                        onSearch={onSearch}
                    />
                    <Select
                        value={selectedCategory}
                        displayEmpty
                        onChange={e => setSelectedCategory(e.target.value)}
                        renderValue={selected => {
                            if(selected.length === 0)
                                return <span className='admin-placeholder'>Filter by Category</span>;

                            return selected;
                        }}
                        >
                            <MenuItem value=''>All Categories</MenuItem>
                            {categories.map((cat, idx) => (<MenuItem key={idx} value={cat}>
                                {cat}
                            </MenuItem>))}
                    </Select>
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
                            <MenuItem value=''>All Categories</MenuItem>
                            {difficulties.map((diff, idx) => (<MenuItem key={idx} value={idx}>
                                {diff}
                            </MenuItem>))}
                    </Select>
                </div>
            </div>

            <DataTable 
                className='studio-con-table'
                data={mappedLessons}
                columns={[
                    { key: 'name', header: 'Lesson', sortable: true },
                    { key: 'categoryName', header: 'Category', sortable: true },
                    { key: 'rating', header: 'Avg. Rating' },
                    { key: 'quiz', header: 'Quiz' },
                    { key: 'visible', header: 'Visibility' },
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
                    navigate(`/moderator/edit-lesson/${row.id}`);
                }}
            />
        </div>
    )
}

export default LessonStudio;