import './Challenges.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Challenge {
    id: number;
    name: string;
    categoryName: string;
    createdAt: string;
}

function Challenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    useEffect(() => {
        axios.get('http://localhost:5072/api/Challenge/GetChallenges', { ////////ispravi
            headers: {Accept: 'application/json'}
        })
        
            .then(response => {
        console.log('Odgovor sa servera:', response.data);
        setChallenges(response.data);})
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