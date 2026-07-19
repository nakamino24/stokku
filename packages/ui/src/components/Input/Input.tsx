import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: '0.75rem', height: '32px' },
  md: { padding: '8px 12px', fontSize: '0.875rem', height: '40px' },
  lg: { padding: '12px 16px', fontSize: '1rem', height: '48px' },
};

export const Input: React.FC<InputProps> = ({
  inputSize = 'md',
  label,
  error,
  hint,
  fullWidth = false,
  style,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: fullWidth ? '100%' : undefined }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          width: fullWidth ? '100%' : undefined,
          borderRadius: '6px',
          border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`,
          backgroundColor: '#ffffff',
          color: '#111827',
          outline: 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          ...sizeStyles[inputSize],
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#dc2626' : '#6366f1';
          e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(220, 38, 38, 0.1)' : 'rgba(99, 102, 241, 0.1)'}`;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
          e.currentTarget.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{hint}</span>
      )}
    </div>
  );
};
