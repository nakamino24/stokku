import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

const paddingStyles = {
  none: { padding: '0px' },
  sm: { padding: '12px' },
  md: { padding: '16px' },
  lg: { padding: '24px' },
} as const;

const variantStyles = {
  default: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  outlined: {
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
  },
  elevated: {
    backgroundColor: '#ffffff',
    border: '1px solid transparent',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
} as const;

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  variant = 'default',
  style,
  className,
  onClick,
}) => {
  return (
    <div
      className={className}
      style={{
        borderRadius: '8px',
        transition: 'box-shadow 150ms ease',
        cursor: onClick ? 'pointer' : undefined,
        ...variantStyles[variant],
        ...paddingStyles[padding],
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div style={{ marginBottom: '16px', ...style }}>{children}</div>
);

export const CardBody: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div style={style}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', ...style }}>
    {children}
  </div>
);
