import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  label,
  error,
  placeholder,
  fullWidth = false,
  style,
  id,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: fullWidth ? '100%' : undefined }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        style={{
          width: fullWidth ? '100%' : undefined,
          padding: '8px 36px 8px 12px',
          fontSize: '0.875rem',
          height: '40px',
          borderRadius: '6px',
          border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`,
          backgroundColor: '#ffffff',
          color: '#111827',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          transition: 'border-color 150ms ease',
          ...style,
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{error}</span>
      )}
    </div>
  );
};
