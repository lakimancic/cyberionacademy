import { useEffect, useRef } from 'react';
import './Background.css';
import { useAuth } from '@/contexts/AuthProvider';

function Background() {
    const particlesRef = useRef<HTMLDivElement | null>(null);
    const auth = useAuth();

    useEffect(() => {
        const particleCount = 80;
        const container = particlesRef.current;
        if(!container) return;

        for(let i = 0; i < particleCount; i++)
            createParticle();

        function createParticle() {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 12 + 6;
            particle.textContent = `${Math.round(Math.random())}`;
            particle.style.fontSize = `${size}px`;

            resetParticle(particle);
            if(container)
                container.appendChild(particle);

            animateParticle(particle);
        }

        function resetParticle(particle: HTMLDivElement): { x: number; y: number } {
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;

            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.opacity = '0';

            return { x: posX, y: posY };
        }

        function animateParticle(particle: HTMLDivElement) {
            const pos = resetParticle(particle);
            const duration = Math.random() * 10 + 10;
            const delay = Math.random() * 5;

            setTimeout(() => {
                particle.style.transition = `all ${duration}s linear`;
                particle.style.opacity = (Math.random() * 0.3 + 0.1).toString();

                const moveX = pos.x + (Math.random() * 20 - 10);
                const moveY = pos.y - Math.random() * 30;

                particle.style.left = `${moveX}%`;
                particle.style.top = `${moveY}%`;

                setTimeout(() => {
                    animateParticle(particle);
                }, duration * 1000);
            }, delay * 1000);
        }

        function handleMouseMove(e: MouseEvent): void {
            const mouseX = (e.clientX / window.innerWidth) * 100;
            const mouseY = (e.clientY / window.innerHeight) * 100;
      
            const particle = document.createElement('div');
            particle.className = 'particle';
      
            const size = Math.random() * 12 + 6;
            particle.textContent = `${Math.round(Math.random())}`;
            particle.style.fontSize = `${size}px`;
            particle.style.left = `${mouseX}%`;
            particle.style.top = `${mouseY}%`;
            particle.style.opacity = '0.4';
            
            if(container)
                container.appendChild(particle);
      
            setTimeout(() => {
                particle.style.transition = 'all 2s ease-out';
                particle.style.left = `${mouseX + (Math.random() * 10 - 5)}%`;
                particle.style.top = `${mouseY + (Math.random() * 10 - 5)}%`;
                particle.style.opacity = '0';
        
                setTimeout(() => {
                    particle.remove();
                }, 2000);
            }, 10);
      
            const spheres = document.querySelectorAll<HTMLElement>('.gradient-sphere');
            const moveX = (e.clientX / window.innerWidth - 0.5) * 5;
            const moveY = (e.clientY / window.innerHeight - 0.5) * 5;
      
            spheres.forEach((sphere) => {
                sphere.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        }
      
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return <div className='gradient-background'>
        <div className={`gradient-sphere sphere-1 gradient-invis${auth?.token ? '' : ''}`}></div>
        <div className={`gradient-sphere sphere-2 gradient-invis${auth?.token ? '' : ''}`}></div>
        <div className={`gradient-sphere sphere-3 gradient-invis${auth?.token ? '' : ''}`}></div>
        <div className="glow"></div>
        <div className="grid-overlay"></div>
        <div className="particles-container" ref={particlesRef}></div>
    </div>
}

export default Background;