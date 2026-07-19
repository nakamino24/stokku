"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '512px' },
    lg: { maxWidth: '640px' },
    xl: { maxWidth: '800px' },
    full: { maxWidth: '100%', margin: '16px' },
};
const Modal = ({ open, onClose, title, children, footer, size = 'md', closeOnOverlay = true, }) => {
    (0, react_1.useEffect)(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
        }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    transition: 'opacity 200ms ease',
                }, onClick: closeOnOverlay ? onClose : undefined }), (0, jsx_runtime_1.jsxs)("div", { role: "dialog", "aria-modal": "true", "aria-label": title, style: {
                    position: 'relative',
                    width: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    ...sizeStyles[size],
                }, children: [title && ((0, jsx_runtime_1.jsxs)("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 24px',
                            borderBottom: '1px solid #f3f4f6',
                        }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }, children: title }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, style: {
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    color: '#6b7280',
                                    fontSize: '1.25rem',
                                    lineHeight: 1,
                                }, "aria-label": "Close", children: "\u2715" })] })), (0, jsx_runtime_1.jsx)("div", { style: { padding: '24px', overflowY: 'auto', flex: 1 }, children: children }), footer && ((0, jsx_runtime_1.jsx)("div", { style: {
                            padding: '16px 24px',
                            borderTop: '1px solid #f3f4f6',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                        }, children: footer }))] })] }));
};
exports.Modal = Modal;
