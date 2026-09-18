import React, { useEffect, useRef } from 'react';

export const SpaceBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    let stars = [];
    const STAR_COUNT = Math.floor(Math.min(width, height) * 0.25) + 60;

    function initStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.1 + 0.2,
          color: '#E8E1D3',
          alpha: Math.random() * 0.5 + 0.1,
          twinkleSpeed: Math.random() * 0.015 + 0.003,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1,
          speedY: (Math.random() - 0.5) * 0.05,
        });
      }
    }

    initStars();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Solid deep industrial background #0B0B0B
      ctx.fillStyle = '#0B0B0B';
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient industrial grid lines
      ctx.strokeStyle = 'rgba(41, 41, 41, 0.25)';
      ctx.lineWidth = 1;
      const gridSize = 120;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw subtle stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.alpha += star.twinkleSpeed * star.twinkleDirection;
        if (star.alpha >= 0.65) {
          star.alpha = 0.65;
          star.twinkleDirection = -1;
        } else if (star.alpha <= 0.08) {
          star.alpha = 0.08;
          star.twinkleDirection = 1;
        }

        star.y += star.speedY;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default SpaceBackground;
