import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
