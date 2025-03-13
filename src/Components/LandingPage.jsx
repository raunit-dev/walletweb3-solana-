import React, { useState } from 'react';
import { Solana } from './Solana';

export function LandingPage() {
    const [ecosystem, setEcosystem] = useState('');

    const handleEcosystemChange = (event) => {
        setEcosystem(event.target.value);
    };

    return (
        <div>
            <h2>Choose Your Ecosystem</h2>
            <select value={ecosystem} onChange={handleEcosystemChange}>
                <option value="">Select an ecosystem</option>
                <option value="solana">Solana</option>
            </select>

            {ecosystem === 'solana' && <Solana />}
        </div>
    );
}