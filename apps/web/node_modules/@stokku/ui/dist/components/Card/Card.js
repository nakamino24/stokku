"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardFooter = exports.CardBody = exports.CardHeader = exports.Card = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const paddingStyles = {
    none: { padding: '0px' },
    sm: { padding: '12px' },
    md: { padding: '16px' },
    lg: { padding: '24px' },
};
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
};
const Card = ({ children, padding = 'md', variant = 'default', style, className, onClick, }) => {
    return ((0, jsx_runtime_1.jsx)("div", { className: className, style: {
            borderRadius: '8px',
            transition: 'box-shadow 150ms ease',
            cursor: onClick ? 'pointer' : undefined,
            ...variantStyles[variant],
            ...paddingStyles[padding],
            ...style,
        }, onClick: onClick, children: children }));
};
exports.Card = Card;
const CardHeader = ({ children, style, }) => ((0, jsx_runtime_1.jsx)("div", { style: { marginBottom: '16px', ...style }, children: children }));
exports.CardHeader = CardHeader;
const CardBody = ({ children, style, }) => ((0, jsx_runtime_1.jsx)("div", { style: style, children: children }));
exports.CardBody = CardBody;
const CardFooter = ({ children, style, }) => ((0, jsx_runtime_1.jsx)("div", { style: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', ...style }, children: children }));
exports.CardFooter = CardFooter;
