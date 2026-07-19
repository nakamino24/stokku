"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spinner = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const sizeMap = {
    sm: 16,
    md: 24,
    lg: 36,
    xl: 48,
};
const Spinner = ({ size = 'md', color = '#6366f1', style, }) => {
    const px = sizeMap[size];
    return ((0, jsx_runtime_1.jsxs)("svg", { width: px, height: px, viewBox: "0 0 24 24", fill: "none", style: { animation: 'spin 1s linear infinite', ...style }, children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "10", stroke: color, strokeWidth: "3", strokeLinecap: "round", strokeDasharray: "31.4 31.4", style: { opacity: 0.2 } }), (0, jsx_runtime_1.jsx)("path", { d: "M12 2a10 10 0 0 1 10 10", stroke: color, strokeWidth: "3", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })] }));
};
exports.Spinner = Spinner;
