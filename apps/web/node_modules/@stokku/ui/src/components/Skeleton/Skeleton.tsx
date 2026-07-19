import React from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  style,
}) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    width: width ?? (variant === 'circular' ? '40px' : '100%'),
    height: height ?? (variant === 'text' ? '16px' : variant === 'circular' ? '40px' : '100px'),
    ...(variant === 'circular' ? { borderRadius: '50%' } : {}),
    ...style,
  };

  return (
    <>
      <style>{`@keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            ...baseStyle,
            ...(i < count - 1 ? { marginBottom: '8px' } : {}),
          }}
        />
      ))}
    </>
  );
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '16px',
          }}
        >
          <Skeleton variant="text" width="60%" height="20px" />
          <div style={{ height: '12px' }} />
          <Skeleton variant="text" width="40%" height="14px" />
          <div style={{ height: '8px' }} />
          <Skeleton variant="text" width="80%" height="14px" />
        </div>
      ))}
    </>
  );
};
