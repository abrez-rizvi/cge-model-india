import React from 'react';

const GlowCard = ({ children, className = "card", style = {} }) => {
  const cardRef = React.useRef(null);
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };
  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlowCard;