import { useMemo } from "react";
import styles from "./floatingParticles.module.css";

const FloatingParticles = ({ count = 50 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,

      // Random starting position
      left: Math.random() * 100,
      top: Math.random() * 100,

      // Random movement points
      x1: Math.random() * 120 - 60,
      y1: Math.random() * 120 - 60,

      x2: Math.random() * 180 - 90,
      y2: Math.random() * 180 - 90,

      x3: Math.random() * 220 - 110,
      y3: Math.random() * 220 - 110,

      // Random size
      size: Math.random() * 7 + 2,

      // Random animation timing
      duration: Math.random() * 8 + 8,
      // delay: Math.random() * 10,

      // Random scale
      scale: Math.random() * 1.5 + 0.5,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={styles["smoke-particle"]}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,

            width: `${particle.size}px`,
            height: `${particle.size}px`,

            "--x1": `${particle.x1}px`,
            "--y1": `${particle.y1}px`,

            "--x2": `${particle.x2}px`,
            "--y2": `${particle.y2}px`,

            "--x3": `${particle.x3}px`,
            "--y3": `${particle.y3}px`,

            "--scale": particle.scale,

            animationDuration: `${particle.duration}s`,
            // animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
