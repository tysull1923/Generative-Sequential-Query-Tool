import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  className?: string;
  showRipple?: boolean;
  disabledTooltip?: string;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    isLoading = false,
    className = '',
    showRipple = true,
    disabledTooltip,
    fullWidth = false,
    disabled,
    onClick,
    ...props
  }, ref) => {
    // Handle click with ripple effect
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!showRipple || disabled || isLoading) return;
      
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${e.clientX - rect.left - radius}px`;
      ripple.style.top = `${e.clientY - rect.top - radius}px`;
      ripple.className = 'absolute rounded-full pointer-events-none bg-white/30 animate-ripple';

      const existingRipple = button.getElementsByClassName('animate-ripple')[0];
      if (existingRipple) {
        existingRipple.remove();
      }

      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
      
      onClick?.(e);
    };

    // Base classes for the button
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden';

    // Variant-specific classes
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400 disabled:bg-transparent'
    };

    // Size-specific classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    // Loading state classes
    const loadingClasses = isLoading ? 'cursor-not-allowed opacity-80' : '';

    // Full width classes
    const widthClasses = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          loadingClasses,
          widthClasses,
          className
        )}
        onClick={handleClick}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        data-tooltip={disabled && disabledTooltip ? disabledTooltip : undefined}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}

        {!isLoading && leftIcon && (
          <span className="mr-2 inline-flex items-center">
            {leftIcon}
          </span>
        )}

        <span className={isLoading ? 'opacity-80' : ''}>
          {children}
        </span>

        {!isLoading && rightIcon && (
          <span className="ml-2 inline-flex items-center">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;