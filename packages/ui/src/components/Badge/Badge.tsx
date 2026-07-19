import React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  primary: { bg: '#eef2ff', text: '#4338ca', dot: '#6366f1' },
  success: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  warning: { bg: '#fefce8', text: '#a16207', dot: '#eab308' },
  danger: { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  info: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: { padding: '2px 8px', fontSize: '0.75rem', height: '20px' },
  md: { padding: '4px 10px', fontSize: '0.75rem', height: '22px' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  style,
}) => {
  const v = variantStyles[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '9999px',
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        backgroundColor: v.bg,
        color: v.text,
        ...sizeStyles[size],
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: v.dot,
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
};
