"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const variantStyles = {
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
const sizeStyles = {
    sm: { padding: '4px 12px', fontSize: '0.75rem', height: '32px' },
    md: { padding: '8px 16px', fontSize: '0.875rem', height: '40px' },
    lg: { padding: '12px 24px', fontSize: '1rem', height: '48px' },
};
const hoverStyles = {
    primary: { backgroundColor: '#4338ca' },
    secondary: { backgroundColor: '#e5e7eb' },
    danger: { backgroundColor: '#b91c1c' },
    ghost: { backgroundColor: '#f3f4f6' },
    outline: { backgroundColor: '#eef2ff' },
};
const Button = ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, children, style, disabled, onMouseEnter, onMouseLeave, ...props }) => {
    const [isHovered, setIsHovered] = react_1.default.useState(false);
    return ((0, jsx_runtime_1.jsxs)("button", { style: {
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
        }, disabled: disabled || loading, onMouseEnter: (e) => { setIsHovered(true); onMouseEnter?.(e); }, onMouseLeave: (e) => { setIsHovered(false); onMouseLeave?.(e); }, ...props, children: [loading && (0, jsx_runtime_1.jsx)(Spinner, { size: "sm" }), children] }));
};
exports.Button = Button;
const Spinner = ({ size }) => {
    const px = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
    return ((0, jsx_runtime_1.jsxs)("svg", { width: px, height: px, viewBox: "0 0 24 24", fill: "none", style: { animation: 'spin 1s linear infinite' }, children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeDasharray: "31.4 31.4", style: { opacity: 0.3 } }), (0, jsx_runtime_1.jsx)("path", { d: "M12 2a10 10 0 0 1 10 10", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })] }));
};
