"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const variantDefaults = {
    h1: { tag: 'h1', style: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.25 } },
    h2: { tag: 'h2', style: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.3 } },
    h3: { tag: 'h3', style: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 } },
    h4: { tag: 'h4', style: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 } },
    body: { tag: 'p', style: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 } },
    'body-sm': { tag: 'p', style: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 } },
    caption: { tag: 'span', style: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4 } },
    label: { tag: 'label', style: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 } },
};
const colorStyles = {
    default: '#111827',
    muted: '#6b7280',
    primary: '#4f46e5',
    danger: '#dc2626',
    success: '#16a34a',
    white: '#ffffff',
};
const weightStyles = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
};
const Text = ({ variant = 'body', color = 'default', weight, align, as: asProp, children, style, className, }) => {
    const v = variantDefaults[variant];
    const Component = asProp || v.tag;
    return ((0, jsx_runtime_1.jsx)(Component, { className: className, style: {
            margin: 0,
            color: colorStyles[color],
            fontWeight: weight ? weightStyles[weight] : v.style.fontWeight,
            textAlign: align,
            ...v.style,
            ...style,
        }, children: children }));
};
exports.Text = Text;
