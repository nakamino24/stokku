"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const variantStyles = {
    default: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
    primary: { bg: '#eef2ff', text: '#4338ca', dot: '#6366f1' },
    success: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
    warning: { bg: '#fefce8', text: '#a16207', dot: '#eab308' },
    danger: { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
    info: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
};
const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '0.75rem', height: '20px' },
    md: { padding: '4px 10px', fontSize: '0.75rem', height: '22px' },
};
const Badge = ({ children, variant = 'default', size = 'md', dot = false, style, }) => {
    const v = variantStyles[variant];
    return ((0, jsx_runtime_1.jsxs)("span", { style: {
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
        }, children: [dot && ((0, jsx_runtime_1.jsx)("span", { style: {
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: v.dot,
                    display: 'inline-block',
                } })), children] }));
};
exports.Badge = Badge;
