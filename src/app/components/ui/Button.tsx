import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'outline' | 'solid'; // Permitir variantes
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'solid', ...props }) => {
  const baseClasses = "px-4 py-2 rounded-xl transition-colors";
  const variantClasses = variant === 'outline'
    ? 'border border-gray-300 text-gray-700 hover:bg-gray-100'
    : 'bg-blue-500 text-white hover:bg-blue-600';

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses}`}
    >
      {children}
    </button>
  );
};
