import quotes from '@/assets/data/quotes.json';
import './Home.css';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import categories from '@/utils/categories';
import difficulties from '@/utils/difficulties';
import { CircularProgress, Rating } from '@mui/material';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNotification } from '@/contexts/Notification/NotificationProvider';
import { useNavigate } from 'react-router-dom';

interface Quote {
    quote: string;
    author: string;
};

interface Recommendations {
    challengeRecs: {
        [key: string]: {
            id: number;
            categoryName: string;
            categoryShort: string;
            difficulty: number;
            name: string;
            avgRating: number;
            points: number;
            archived: boolean;
        }[]
    },
    lessonRecs: {
        [key: string]: {
            id: number;
            categoryName: string;
            categoryShort: string;
            difficulty: number;
            title: string;
            avgRating: number;
        }[]
    }
};

interface Recommendation {
    type: 'challenge' | 'lesson';
    label: string;
    array: {
        id: number;
        categoryName: string;
        categoryShort: string;
        difficulty: number;
        name?: string;
        title?: string;
        avgRating: number;
        points?: number;
        archived?: boolean;
    }[]
};

function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function HomePage() {
    const [quote, setQuote] = useState<Quote>({ quote: '', author: '' });
    const [opacity, setOpacity] = useState(0);
    const [recomms, setRecomms] = useState<Recommendation[]>([]);
    const [rIndex, setRIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const handleError = useErrorHandler();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const randomQuote = () => {
        return quotes[Math.floor(Math.random() * quotes.length)];
    };

    const transformRecommendations = (recs: Recommendations): Recommendation[] => {
        const challengeEntries = Object.entries(recs.challengeRecs)
            .filter(([_, items]) => items.length > 0)
            .map(([label, array]) => ({
                type: 'challenge' as const,
                label,
                array: array.map(item => ({
                    id: item.id,
                    categoryName: item.categoryName,
                    categoryShort: item.categoryShort,
                    difficulty: item.difficulty,
                    name: item.name,
                    avgRating: item.avgRating,
                    points: item.points,
                    archived: item.archived
                }))
            }));
        
        const lessonEntries = Object.entries(recs.lessonRecs)
            .filter(([_, items]) => items.length > 0)
            .map(([label, array]) => ({
                type: 'lesson' as const,
                label,
                array: array.map(item => ({
                    id: item.id,
                    categoryName: item.categoryName,
                    categoryShort: item.categoryShort,
                    difficulty: item.difficulty,
                    title: item.title,
                    avgRating: item.avgRating
                }))
            }));
        
        const combined = [...challengeEntries, ...lessonEntries];
        return shuffleArray(combined);
    }

    const fetchRecommendations = () => {
        api.get("/Recommendation")
            .then(resp => {
                const data: Recommendations = resp.data;
                setRecomms(transformRecommendations(data));
                setRIndex(0);
            })
            .catch(err => {
                handleError(err, msg => showNotification(msg, 'error'));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const mappedReccoms = useMemo(() =>  recomms.map((r, i) => (
        <div 
            className="home-recomm"
            key={i}
        >
            <h2>{r.label}</h2>
            {r.array.map((item, ii) => (
                <div className="home-recomm-item" key={ii} onClick={() => navigate(`/${r.type}s/${item.id}`)}>
                    <img src={(categories as any)[item.categoryShort]} />
                    <div className="challenge-name">
                        <strong>{r.type === 'challenge' ? item.name : item.title}</strong>
                        <div className="difficulty">
                            {difficulties[item.difficulty] ?? "Unknown"}
                        </div>
                    </div>
                    <span>{item.categoryName}</span>
                    <Rating
                        value={item.avgRating}
                        precision={0.1}
                        readOnly
                        size="small"
                    />
                </div>
            ))}
        </div>
    )), [recomms]);

    useEffect(() => {
        setQuote(randomQuote());
        setTimeout(() => setOpacity(1), 500);

        const interval = setInterval(() => {
            setOpacity(0);
            setTimeout(() => {
                setQuote(randomQuote());
                setTimeout(() => setOpacity(1), 500);
            }, 1000);
        }, 10000);

        fetchRecommendations();

        return () => {
            clearInterval(interval);
        }
    }, []);

    return (
        <div className="home-page">
            <h1>Cyberion<span>Academy</span></h1>
            <blockquote style={{ opacity: opacity }}>
                "{quote.quote}"
                 <p className='home-quote-author'>- {quote.author}</p>
            </blockquote>
            <h2><MdKeyboardArrowLeft 
                className={rIndex === 0 ? 'home-disabled' : ''} 
                onClick={() => setRIndex(prev => Math.max(0, prev - 1))}
            /> 
            Recommendations 
            <MdKeyboardArrowRight 
                className={rIndex >= recomms.length - 3 ? 'home-disabled' : ''} 
                onClick={() => setRIndex(prev => Math.min(recomms.length - 3, prev + 1))}
            /></h2>
            {!loading && <div className="home-recomms">
                <div 
                    className="recomm-track"
                    style={{
                    transform: `translateX(${-100 * rIndex / 3}%)`,
                    transition: 'transform 300ms ease-out',
                    display: 'flex',
                    width: '100%'
                    }}
                >{mappedReccoms}</div>
            </div>}
            {loading && <CircularProgress size={40} />}
        </div>
    )
}

export default HomePage;