import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
