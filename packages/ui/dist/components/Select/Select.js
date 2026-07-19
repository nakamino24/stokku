"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Select = ({ options, label, error, placeholder, fullWidth = false, style, id, ...props }) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: fullWidth ? '100%' : undefined }, children: [label && ((0, jsx_runtime_1.jsx)("label", { htmlFor: selectId, style: { fontSize: '0.875rem', fontWeight: 500, color: '#374151' }, children: label })), (0, jsx_runtime_1.jsxs)("select", { id: selectId, style: {
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
                }, ...props, children: [placeholder && ((0, jsx_runtime_1.jsx)("option", { value: "", disabled: true, children: placeholder })), options.map((opt) => ((0, jsx_runtime_1.jsx)("option", { value: opt.value, disabled: opt.disabled, children: opt.label }, opt.value)))] }), error && ((0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.75rem', color: '#dc2626' }, children: error }))] }));
};
exports.Select = Select;
