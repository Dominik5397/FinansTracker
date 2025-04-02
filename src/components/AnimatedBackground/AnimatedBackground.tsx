import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material';

interface AnimatedBackgroundProps {
  particleCount?: number;
  lineCount?: number;
  opacity?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

interface Line {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  color: string;
  opacity: number;
  speed: number;
  angle: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  particleCount = 20,
  lineCount = 10,
  opacity = 0.3
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  
  // Inicjalizacja cząsteczek i linii
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        canvas.width = width;
        canvas.height = height;
        
        setDimensions({ width, height });
        
        // Inicjalizuj nowe cząsteczki na podstawie nowych wymiarów
        const newParticles: Particle[] = [];
        for (let i = 0; i < particleCount; i++) {
          newParticles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 1,
            speedY: (Math.random() - 0.5) * 1,
            color: Math.random() > 0.5 ? primaryColor : secondaryColor,
            opacity: Math.random() * 0.5 + 0.1
          });
        }
        setParticles(newParticles);
        
        // Inicjalizuj nowe linie
        const newLines: Line[] = [];
        for (let i = 0; i < lineCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const length = Math.random() * 150 + 50;
          const centerX = Math.random() * width;
          const centerY = Math.random() * height;
          
          newLines.push({
            startX: centerX,
            startY: centerY,
            endX: centerX + Math.cos(angle) * length,
            endY: centerY + Math.sin(angle) * length,
            width: Math.random() * 1.5 + 0.5,
            color: Math.random() > 0.5 ? primaryColor : secondaryColor,
            opacity: Math.random() * 0.2 + 0.05,
            speed: (Math.random() - 0.5) * 0.5,
            angle
          });
        }
        setLines(newLines);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [particleCount, lineCount, primaryColor, secondaryColor]);
  
  // Obsługa ruchu myszy
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Animacja
  useEffect(() => {
    if (!canvasRef.current || particles.length === 0 || lines.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    
    const render = () => {
      if (!ctx) return;
      
      // Wyczyść canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Aktualizuj i rysuj cząsteczki
      const updatedParticles = particles.map(particle => {
        // Oblicz dystans od kursora
        const dx = mousePosition.x - particle.x;
        const dy = mousePosition.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Siła odpychania
        const maxDistance = 150;
        let repulsionForce = { x: 0, y: 0 };
        
        if (distance < maxDistance && distance > 0) {
          const force = (1 - distance / maxDistance) * 0.5;
          repulsionForce = {
            x: -dx / distance * force,
            y: -dy / distance * force
          };
        }
        
        // Aktualizacja pozycji
        let newX = particle.x + particle.speedX + repulsionForce.x;
        let newY = particle.y + particle.speedY + repulsionForce.y;
        
        // Odbicie od krawędzi
        if (newX < 0 || newX > canvas.width) {
          particle.speedX *= -1;
          newX = Math.max(0, Math.min(newX, canvas.width));
        }
        
        if (newY < 0 || newY > canvas.height) {
          particle.speedY *= -1;
          newY = Math.max(0, Math.min(newY, canvas.height));
        }
        
        // Rysuj cząsteczkę
        ctx.beginPath();
        ctx.arc(newX, newY, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
        
        return {
          ...particle,
          x: newX,
          y: newY
        };
      });
      
      // Aktualizuj i rysuj linie
      const updatedLines = lines.map(line => {
        // Aktualizacja kąta
        const newAngle = line.angle + line.speed;
        const length = Math.sqrt(Math.pow(line.endX - line.startX, 2) + Math.pow(line.endY - line.startY, 2));
        
        // Oblicz dystans środka linii od kursora
        const centerX = (line.startX + line.endX) / 2;
        const centerY = (line.startY + line.endY) / 2;
        const dx = mousePosition.x - centerX;
        const dy = mousePosition.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Oblicz nowy kąt w stronę kursora
        let targetAngle = newAngle;
        if (distance < 200 && distance > 0) {
          const mouseAngle = Math.atan2(dy, dx);
          const angleDiff = mouseAngle - newAngle;
          
          // Normalizuj różnicę kątów
          const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          
          // Stopniowo obracaj linię w kierunku kursora
          targetAngle = newAngle + normalizedDiff * 0.03;
        }
        
        // Oblicz nowe punkty końcowe
        const newStartX = centerX - Math.cos(targetAngle) * length / 2;
        const newStartY = centerY - Math.sin(targetAngle) * length / 2;
        const newEndX = centerX + Math.cos(targetAngle) * length / 2;
        const newEndY = centerY + Math.sin(targetAngle) * length / 2;
        
        // Rysuj linię
        ctx.beginPath();
        ctx.moveTo(newStartX, newStartY);
        ctx.lineTo(newEndX, newEndY);
        ctx.lineWidth = line.width;
        ctx.strokeStyle = `${line.color}${Math.floor(line.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.stroke();
        
        return {
          ...line,
          startX: newStartX,
          startY: newStartY,
          endX: newEndX,
          endY: newEndY,
          angle: targetAngle
        };
      });
      
      setParticles(updatedParticles);
      setLines(updatedLines);
      
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [particles, lines, mousePosition, dimensions]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -9999,  // Bardzo niski z-index
        pointerEvents: 'none',
        opacity: opacity || 0.05  // Bardzo niska przezroczystość domyślnie
      }}
      aria-hidden="true"
    />
  );
};

export default AnimatedBackground; 