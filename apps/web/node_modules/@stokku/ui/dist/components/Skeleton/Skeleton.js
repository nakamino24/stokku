"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkeletonCard = exports.Skeleton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Skeleton = ({ variant = 'text', width, height, count = 1, style, }) => {
    const baseStyle = {
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        width: width ?? (variant === 'circular' ? '40px' : '100%'),
        height: height ?? (variant === 'text' ? '16px' : variant === 'circular' ? '40px' : '100px'),
        ...(variant === 'circular' ? { borderRadius: '50%' } : {}),
        ...style,
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("style", { children: `@keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }` }), Array.from({ length: count }).map((_, i) => ((0, jsx_runtime_1.jsx)("div", { style: {
                    ...baseStyle,
                    ...(i < count - 1 ? { marginBottom: '8px' } : {}),
                } }, i)))] }));
};
exports.Skeleton = Skeleton;
const SkeletonCard = ({ count = 1 }) => {
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: Array.from({ length: count }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { style: {
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: '16px',
            }, children: [(0, jsx_runtime_1.jsx)(exports.Skeleton, { variant: "text", width: "60%", height: "20px" }), (0, jsx_runtime_1.jsx)("div", { style: { height: '12px' } }), (0, jsx_runtime_1.jsx)(exports.Skeleton, { variant: "text", width: "40%", height: "14px" }), (0, jsx_runtime_1.jsx)("div", { style: { height: '8px' } }), (0, jsx_runtime_1.jsx)(exports.Skeleton, { variant: "text", width: "80%", height: "14px" })] }, i))) }));
};
exports.SkeletonCard = SkeletonCard;
