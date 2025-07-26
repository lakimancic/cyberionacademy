import './Challenges.css';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Challenge {
    id: number;
    name: string;
    categoryName: string;
    createdAt: string;
}

function Challenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    useEffect(() => {
        api.get('/Challenge/GetChallenges')//
            .then(response => {
                console.log('Odgovor sa servera:', response.data);
                setChallenges(response.data);
            })
            .catch(error => console.error('Greška pri dohvatanju izazova:', error));
    }, []);

    return (
        <div>
            <h2>Lista Izazova</h2>
            <ul>
                {challenges.map(challenge => (
                    <li key={challenge.id}>
                        <strong>{challenge.name}</strong> – {challenge.categoryName} – {new Date(challenge.createdAt).toLocaleDateString()}
                    </li>
                ))}
            </ul>
        </div>
    );
}


export default Challenges;