"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const sizeStyles = {
    sm: { padding: '4px 12px', fontSize: '0.75rem', height: '32px' },
    md: { padding: '8px 12px', fontSize: '0.875rem', height: '40px' },
    lg: { padding: '12px 16px', fontSize: '1rem', height: '48px' },
};
const Input = ({ inputSize = 'md', label, error, hint, fullWidth = false, style, id, ...props }) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: fullWidth ? '100%' : undefined }, children: [label && ((0, jsx_runtime_1.jsx)("label", { htmlFor: inputId, style: {
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                }, children: label })), (0, jsx_runtime_1.jsx)("input", { id: inputId, style: {
                    width: fullWidth ? '100%' : undefined,
                    borderRadius: '6px',
                    border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`,
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    outline: 'none',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    ...sizeStyles[inputSize],
                    ...style,
                }, onFocus: (e) => {
                    e.currentTarget.style.borderColor = error ? '#dc2626' : '#6366f1';
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(220, 38, 38, 0.1)' : 'rgba(99, 102, 241, 0.1)'}`;
                    props.onFocus?.(e);
                }, onBlur: (e) => {
                    e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                    props.onBlur?.(e);
                }, ...props }), error && ((0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.75rem', color: '#dc2626' }, children: error })), hint && !error && ((0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.75rem', color: '#6b7280' }, children: hint }))] }));
};
exports.Input = Input;
