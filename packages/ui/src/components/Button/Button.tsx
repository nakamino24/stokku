import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: '1px solid #4f46e5',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
  },
  danger: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: '1px solid #dc2626',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#374151',
    border: '1px solid transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#4f46e5',
    border: '1px solid #4f46e5',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: '0.75rem', height: '32px' },
  md: { padding: '8px 16px', fontSize: '0.875rem', height: '40px' },
  lg: { padding: '12px 24px', fontSize: '1rem', height: '48px' },
};

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: '#4338ca' },
  secondary: { backgroundColor: '#e5e7eb' },
  danger: { backgroundColor: '#b91c1c' },
  ghost: { backgroundColor: '#f3f4f6' },
  outline: { backgroundColor: '#eef2ff' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 500,
        borderRadius: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'all 150ms ease',
        width: fullWidth ? '100%' : undefined,
        outline: 'none',
        ...variantStyles[variant],
        ...(isHovered && !disabled && !loading ? hoverStyles[variant] : {}),
        ...sizeStyles[size],
        ...style,
      }}
      disabled={disabled || loading}
      onMouseEnter={(e) => { setIsHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setIsHovered(false); onMouseLeave?.(e); }}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
};

const Spinner: React.FC<{ size: string }> = ({ size }) => {
  const px = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        style={{ opacity: 0.3 }}
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
};
