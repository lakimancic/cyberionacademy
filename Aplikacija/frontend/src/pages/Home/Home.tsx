import quotes from '@/assets/data/quotes.json';
import './Home.css';
import { useEffect, useState } from 'react';

interface Quote {
    quote: string;
    author: string;
}

function HomePage() {
    const [quote, setQuote] = useState<Quote>({ quote: '', author: '' });
    const [opacity, setOpacity] = useState(0);

    const randomQuote = () => {
        return quotes[Math.floor(Math.random() * quotes.length)];
    };

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
        </div>
    )
}

export default HomePage;