import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary:
      'bg-blue-600 text-white shadow-lg shadow-blue-200/60 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200/70 focus:ring-blue-100',

    secondary:
      'bg-gray-100 text-gray-900 shadow-sm hover:-translate-y-0.5 hover:bg-gray-200 hover:shadow-md focus:ring-gray-100',

    outline:
      'border border-gray-200 bg-white text-gray-800 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md focus:ring-blue-100',

    danger:
      'bg-red-600 text-white shadow-lg shadow-red-200/60 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-200/70 focus:ring-red-100',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
