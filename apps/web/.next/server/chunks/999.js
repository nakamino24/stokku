"use strict";
exports.id = 999;
exports.ids = [999];
exports.modules = {

/***/ 5999:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Ct": () => (/* reexport */ Badge),
  "zx": () => (/* reexport */ Button),
  "Zb": () => (/* reexport */ Card),
  "$j": () => (/* reexport */ Spinner_Spinner)
});

// UNUSED EXPORTS: CardBody, CardFooter, CardHeader, Input, Modal, Select, Skeleton, SkeletonCard, Text, borderRadius, boxShadow, colors, fontSize, fontWeight, spacing

// EXTERNAL MODULE: ../../node_modules/.pnpm/react@18.2.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(7458);
// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(6689);
var external_react_default = /*#__PURE__*/__webpack_require__.n(external_react_);
;// CONCATENATED MODULE: ../../packages/ui/src/components/Button/Button.tsx


const variantStyles = {
    primary: {
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        border: "1px solid #4f46e5"
    },
    secondary: {
        backgroundColor: "#f3f4f6",
        color: "#374151",
        border: "1px solid #e5e7eb"
    },
    danger: {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        border: "1px solid #dc2626"
    },
    ghost: {
        backgroundColor: "transparent",
        color: "#374151",
        border: "1px solid transparent"
    },
    outline: {
        backgroundColor: "transparent",
        color: "#4f46e5",
        border: "1px solid #4f46e5"
    }
};
const sizeStyles = {
    sm: {
        padding: "4px 12px",
        fontSize: "0.75rem",
        height: "32px"
    },
    md: {
        padding: "8px 16px",
        fontSize: "0.875rem",
        height: "40px"
    },
    lg: {
        padding: "12px 24px",
        fontSize: "1rem",
        height: "48px"
    }
};
const hoverStyles = {
    primary: {
        backgroundColor: "#4338ca"
    },
    secondary: {
        backgroundColor: "#e5e7eb"
    },
    danger: {
        backgroundColor: "#b91c1c"
    },
    ghost: {
        backgroundColor: "#f3f4f6"
    },
    outline: {
        backgroundColor: "#eef2ff"
    }
};
const Button = ({ variant ="primary" , size ="md" , loading =false , fullWidth =false , children , style , disabled , onMouseEnter , onMouseLeave , ...props })=>{
    const [isHovered, setIsHovered] = external_react_default().useState(false);
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("button", {
        style: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: 500,
            borderRadius: "6px",
            cursor: disabled || loading ? "not-allowed" : "pointer",
            opacity: disabled || loading ? 0.5 : 1,
            transition: "all 150ms ease",
            width: fullWidth ? "100%" : undefined,
            outline: "none",
            ...variantStyles[variant],
            ...isHovered && !disabled && !loading ? hoverStyles[variant] : {},
            ...sizeStyles[size],
            ...style
        },
        disabled: disabled || loading,
        onMouseEnter: (e)=>{
            setIsHovered(true);
            onMouseEnter?.(e);
        },
        onMouseLeave: (e)=>{
            setIsHovered(false);
            onMouseLeave?.(e);
        },
        ...props,
        children: [
            loading && /*#__PURE__*/ jsx_runtime.jsx(Spinner, {
                size: "sm"
            }),
            children
        ]
    });
};
const Spinner = ({ size  })=>{
    const px = size === "sm" ? 14 : size === "lg" ? 24 : 18;
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("svg", {
        width: px,
        height: px,
        viewBox: "0 0 24 24",
        fill: "none",
        style: {
            animation: "spin 1s linear infinite"
        },
        children: [
            /*#__PURE__*/ jsx_runtime.jsx("circle", {
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "3",
                strokeLinecap: "round",
                strokeDasharray: "31.4 31.4",
                style: {
                    opacity: 0.3
                }
            }),
            /*#__PURE__*/ jsx_runtime.jsx("path", {
                d: "M12 2a10 10 0 0 1 10 10",
                stroke: "currentColor",
                strokeWidth: "3",
                strokeLinecap: "round"
            }),
            /*#__PURE__*/ jsx_runtime.jsx("style", {
                children: `@keyframes spin { to { transform: rotate(360deg); } }`
            })
        ]
    });
};

;// CONCATENATED MODULE: ../../packages/ui/src/components/Input/Input.tsx


const Input_sizeStyles = {
    sm: {
        padding: "4px 12px",
        fontSize: "0.75rem",
        height: "32px"
    },
    md: {
        padding: "8px 12px",
        fontSize: "0.875rem",
        height: "40px"
    },
    lg: {
        padding: "12px 16px",
        fontSize: "1rem",
        height: "48px"
    }
};
const Input = ({ inputSize ="md" , label , error , hint , fullWidth =false , style , id , ...props })=>{
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return /*#__PURE__*/ _jsxs("div", {
        style: {
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            width: fullWidth ? "100%" : undefined
        },
        children: [
            label && /*#__PURE__*/ _jsx("label", {
                htmlFor: inputId,
                style: {
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#374151"
                },
                children: label
            }),
            /*#__PURE__*/ _jsx("input", {
                id: inputId,
                style: {
                    width: fullWidth ? "100%" : undefined,
                    borderRadius: "6px",
                    border: `1px solid ${error ? "#dc2626" : "#d1d5db"}`,
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                    ...Input_sizeStyles[inputSize],
                    ...style
                },
                onFocus: (e)=>{
                    e.currentTarget.style.borderColor = error ? "#dc2626" : "#6366f1";
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? "rgba(220, 38, 38, 0.1)" : "rgba(99, 102, 241, 0.1)"}`;
                    props.onFocus?.(e);
                },
                onBlur: (e)=>{
                    e.currentTarget.style.borderColor = error ? "#dc2626" : "#d1d5db";
                    e.currentTarget.style.boxShadow = "none";
                    props.onBlur?.(e);
                },
                ...props
            }),
            error && /*#__PURE__*/ _jsx("span", {
                style: {
                    fontSize: "0.75rem",
                    color: "#dc2626"
                },
                children: error
            }),
            hint && !error && /*#__PURE__*/ _jsx("span", {
                style: {
                    fontSize: "0.75rem",
                    color: "#6b7280"
                },
                children: hint
            })
        ]
    });
};

;// CONCATENATED MODULE: ../../packages/ui/src/components/Card/Card.tsx


const paddingStyles = {
    none: {
        padding: "0px"
    },
    sm: {
        padding: "12px"
    },
    md: {
        padding: "16px"
    },
    lg: {
        padding: "24px"
    }
};
const Card_variantStyles = {
    default: {
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    },
    outlined: {
        backgroundColor: "transparent",
        border: "1px solid #e5e7eb"
    },
    elevated: {
        backgroundColor: "#ffffff",
        border: "1px solid transparent",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
    }
};
const Card = ({ children , padding ="md" , variant ="default" , style , className , onClick  })=>{
    return /*#__PURE__*/ jsx_runtime.jsx("div", {
        className: className,
        style: {
            borderRadius: "8px",
            transition: "box-shadow 150ms ease",
            cursor: onClick ? "pointer" : undefined,
            ...Card_variantStyles[variant],
            ...paddingStyles[padding],
            ...style
        },
        onClick: onClick,
        children: children
    });
};
const CardHeader = ({ children , style  })=>/*#__PURE__*/ _jsx("div", {
        style: {
            marginBottom: "16px",
            ...style
        },
        children: children
    });
const CardBody = ({ children , style  })=>/*#__PURE__*/ _jsx("div", {
        style: style,
        children: children
    });
const CardFooter = ({ children , style  })=>/*#__PURE__*/ _jsx("div", {
        style: {
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #f3f4f6",
            ...style
        },
        children: children
    });

;// CONCATENATED MODULE: ../../packages/ui/src/components/Badge/Badge.tsx


const Badge_variantStyles = {
    default: {
        bg: "#f3f4f6",
        text: "#374151",
        dot: "#9ca3af"
    },
    primary: {
        bg: "#eef2ff",
        text: "#4338ca",
        dot: "#6366f1"
    },
    success: {
        bg: "#f0fdf4",
        text: "#15803d",
        dot: "#22c55e"
    },
    warning: {
        bg: "#fefce8",
        text: "#a16207",
        dot: "#eab308"
    },
    danger: {
        bg: "#fef2f2",
        text: "#b91c1c",
        dot: "#ef4444"
    },
    info: {
        bg: "#eff6ff",
        text: "#1d4ed8",
        dot: "#3b82f6"
    }
};
const Badge_sizeStyles = {
    sm: {
        padding: "2px 8px",
        fontSize: "0.75rem",
        height: "20px"
    },
    md: {
        padding: "4px 10px",
        fontSize: "0.75rem",
        height: "22px"
    }
};
const Badge = ({ children , variant ="default" , size ="md" , dot =false , style  })=>{
    const v = Badge_variantStyles[variant];
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("span", {
        style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "9999px",
            fontWeight: 500,
            lineHeight: 1,
            whiteSpace: "nowrap",
            backgroundColor: v.bg,
            color: v.text,
            ...Badge_sizeStyles[size],
            ...style
        },
        children: [
            dot && /*#__PURE__*/ jsx_runtime.jsx("span", {
                style: {
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: v.dot,
                    display: "inline-block"
                }
            }),
            children
        ]
    });
};

;// CONCATENATED MODULE: ../../packages/ui/src/components/Modal/Modal.tsx


const Modal_sizeStyles = {
    sm: {
        maxWidth: "400px"
    },
    md: {
        maxWidth: "512px"
    },
    lg: {
        maxWidth: "640px"
    },
    xl: {
        maxWidth: "800px"
    },
    full: {
        maxWidth: "100%",
        margin: "16px"
    }
};
const Modal = ({ open , onClose , title , children , footer , size ="md" , closeOnOverlay =true  })=>{
    useEffect(()=>{
        if (!open) return;
        const handler = (e)=>{
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        document.body.style.overflow = "hidden";
        return ()=>{
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [
        open,
        onClose
    ]);
    if (!open) return null;
    return /*#__PURE__*/ _jsxs("div", {
        style: {
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
        },
        children: [
            /*#__PURE__*/ _jsx("div", {
                style: {
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    transition: "opacity 200ms ease"
                },
                onClick: closeOnOverlay ? onClose : undefined
            }),
            /*#__PURE__*/ _jsxs("div", {
                role: "dialog",
                "aria-modal": "true",
                "aria-label": title,
                style: {
                    position: "relative",
                    width: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    ...Modal_sizeStyles[size]
                },
                children: [
                    title && /*#__PURE__*/ _jsxs("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "16px 24px",
                            borderBottom: "1px solid #f3f4f6"
                        },
                        children: [
                            /*#__PURE__*/ _jsx("h2", {
                                style: {
                                    margin: 0,
                                    fontSize: "1.125rem",
                                    fontWeight: 600,
                                    color: "#111827"
                                },
                                children: title
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                onClick: onClose,
                                style: {
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "4px",
                                    color: "#6b7280",
                                    fontSize: "1.25rem",
                                    lineHeight: 1
                                },
                                "aria-label": "Close",
                                children: "✕"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        style: {
                            padding: "24px",
                            overflowY: "auto",
                            flex: 1
                        },
                        children: children
                    }),
                    footer && /*#__PURE__*/ _jsx("div", {
                        style: {
                            padding: "16px 24px",
                            borderTop: "1px solid #f3f4f6",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "8px"
                        },
                        children: footer
                    })
                ]
            })
        ]
    });
};

;// CONCATENATED MODULE: ../../packages/ui/src/components/Spinner/Spinner.tsx


const sizeMap = {
    sm: 16,
    md: 24,
    lg: 36,
    xl: 48
};
const Spinner_Spinner = ({ size ="md" , color ="#6366f1" , style  })=>{
    const px = sizeMap[size];
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("svg", {
        width: px,
        height: px,
        viewBox: "0 0 24 24",
        fill: "none",
        style: {
            animation: "spin 1s linear infinite",
            ...style
        },
        children: [
            /*#__PURE__*/ jsx_runtime.jsx("circle", {
                cx: "12",
                cy: "12",
                r: "10",
                stroke: color,
                strokeWidth: "3",
                strokeLinecap: "round",
                strokeDasharray: "31.4 31.4",
                style: {
                    opacity: 0.2
                }
            }),
            /*#__PURE__*/ jsx_runtime.jsx("path", {
                d: "M12 2a10 10 0 0 1 10 10",
                stroke: color,
                strokeWidth: "3",
                strokeLinecap: "round"
            }),
            /*#__PURE__*/ jsx_runtime.jsx("style", {
                children: `@keyframes spin { to { transform: rotate(360deg); } }`
            })
        ]
    });
};

;// CONCATENATED MODULE: ../../packages/ui/src/components/Select/Select.tsx


const Select = ({ options , label , error , placeholder , fullWidth =false , style , id , ...props })=>{
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return /*#__PURE__*/ _jsxs("div", {
        style: {
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            width: fullWidth ? "100%" : undefined
        },
        children: [
            label && /*#__PURE__*/ _jsx("label", {
                htmlFor: selectId,
                style: {
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#374151"
                },
                children: label
            }),
            /*#__PURE__*/ _jsxs("select", {
                id: selectId,
                style: {
                    width: fullWidth ? "100%" : undefined,
                    padding: "8px 36px 8px 12px",
                    fontSize: "0.875rem",
                    height: "40px",
                    borderRadius: "6px",
                    border: `1px solid ${error ? "#dc2626" : "#d1d5db"}`,
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    transition: "border-color 150ms ease",
                    ...style
                },
                ...props,
                children: [
                    placeholder && /*#__PURE__*/ _jsx("option", {
                        value: "",
                        disabled: true,
                        children: placeholder
                    }),
                    options.map((opt)=>/*#__PURE__*/ _jsx("option", {
                            value: opt.value,
                            disabled: opt.disabled,
                            children: opt.label
                        }, opt.value))
                ]
            }),
            error && /*#__PURE__*/ _jsx("span", {
                style: {
                    fontSize: "0.75rem",
                    color: "#dc2626"
                },
                children: error
            })
        ]
    });
};

;// CONCATENATED MODULE: ../../packages/ui/src/components/Text/Text.tsx


const variantDefaults = {
    h1: {
        tag: "h1",
        style: {
            fontSize: "2.25rem",
            fontWeight: 700,
            lineHeight: 1.25
        }
    },
    h2: {
        tag: "h2",
        style: {
            fontSize: "1.875rem",
            fontWeight: 700,
            lineHeight: 1.3
        }
    },
    h3: {
        tag: "h3",
        style: {
            fontSize: "1.5rem",
            fontWeight: 600,
            lineHeight: 1.4
        }
    },
    h4: {
        tag: "h4",
        style: {
            fontSize: "1.25rem",
            fontWeight: 600,
            lineHeight: 1.4
        }
    },
    body: {
        tag: "p",
        style: {
            fontSize: "1rem",
            fontWeight: 400,
            lineHeight: 1.6
        }
    },
    "body-sm": {
        tag: "p",
        style: {
            fontSize: "0.875rem",
            fontWeight: 400,
            lineHeight: 1.5
        }
    },
    caption: {
        tag: "span",
        style: {
            fontSize: "0.75rem",
            fontWeight: 400,
            lineHeight: 1.4
        }
    },
    label: {
        tag: "label",
        style: {
            fontSize: "0.875rem",
            fontWeight: 500,
            lineHeight: 1.4
        }
    }
};
const colorStyles = {
    default: "#111827",
    muted: "#6b7280",
    primary: "#4f46e5",
    danger: "#dc2626",
    success: "#16a34a",
    white: "#ffffff"
};
const weightStyles = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
};
const Text = ({ variant ="body" , color ="default" , weight , align , as: asProp , children , style , className  })=>{
    const v = variantDefaults[variant];
    const Component = asProp || v.tag;
    return /*#__PURE__*/ _jsx(Component, {
        className: className,
        style: {
            margin: 0,
            color: colorStyles[color],
            fontWeight: weight ? weightStyles[weight] : v.style.fontWeight,
            textAlign: align,
            ...v.style,
            ...style
        },
        children: children
    });
};

;// CONCATENATED MODULE: ../../packages/ui/src/components/Skeleton/Skeleton.tsx


const Skeleton = ({ variant ="text" , width , height , count =1 , style  })=>{
    const baseStyle = {
        backgroundColor: "#f3f4f6",
        borderRadius: "4px",
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
        width: width ?? (variant === "circular" ? "40px" : "100%"),
        height: height ?? (variant === "text" ? "16px" : variant === "circular" ? "40px" : "100px"),
        ...variant === "circular" ? {
            borderRadius: "50%"
        } : {},
        ...style
    };
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsx("style", {
                children: `@keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`
            }),
            Array.from({
                length: count
            }).map((_, i)=>/*#__PURE__*/ _jsx("div", {
                    style: {
                        ...baseStyle,
                        ...i < count - 1 ? {
                            marginBottom: "8px"
                        } : {}
                    }
                }, i))
        ]
    });
};
const SkeletonCard = ({ count =1  })=>{
    return /*#__PURE__*/ _jsx(_Fragment, {
        children: Array.from({
            length: count
        }).map((_, i)=>/*#__PURE__*/ _jsxs("div", {
                style: {
                    padding: "24px",
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "16px"
                },
                children: [
                    /*#__PURE__*/ _jsx(Skeleton, {
                        variant: "text",
                        width: "60%",
                        height: "20px"
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        style: {
                            height: "12px"
                        }
                    }),
                    /*#__PURE__*/ _jsx(Skeleton, {
                        variant: "text",
                        width: "40%",
                        height: "14px"
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        style: {
                            height: "8px"
                        }
                    }),
                    /*#__PURE__*/ _jsx(Skeleton, {
                        variant: "text",
                        width: "80%",
                        height: "14px"
                    })
                ]
            }, i))
    });
};

;// CONCATENATED MODULE: ../../packages/ui/src/styles/tokens.ts
const colors = {
    primary: {
        50: "#eef2ff",
        100: "#e0e7ff",
        200: "#c7d2fe",
        300: "#a5b4fc",
        400: "#818cf8",
        500: "#6366f1",
        600: "#4f46e5",
        700: "#4338ca",
        800: "#3730a3",
        900: "#312e81",
        950: "#1e1b4b"
    },
    gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
        950: "#030712"
    },
    red: {
        50: "#fef2f2",
        100: "#fee2e2",
        200: "#fecaca",
        300: "#fca5a5",
        400: "#f87171",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
        800: "#991b1b",
        900: "#7f1d1d"
    },
    green: {
        50: "#f0fdf4",
        100: "#dcfce7",
        200: "#bbf7d0",
        300: "#86efac",
        400: "#4ade80",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
        800: "#166534",
        900: "#14532d"
    },
    yellow: {
        50: "#fefce8",
        100: "#fef9c3",
        200: "#fef08a",
        300: "#fde047",
        400: "#facc15",
        500: "#eab308",
        600: "#ca8a04",
        700: "#a16207",
        800: "#854d0e",
        900: "#713f12"
    },
    blue: {
        50: "#eff6ff",
        100: "#dbeafe",
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        800: "#1e40af",
        900: "#1e3a8a"
    },
    white: "#ffffff",
    black: "#000000"
};
const spacing = {
    0: "0px",
    0.5: "2px",
    1: "4px",
    1.5: "6px",
    2: "8px",
    2.5: "10px",
    3: "12px",
    3.5: "14px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "28px",
    8: "32px",
    9: "36px",
    10: "40px",
    11: "44px",
    12: "48px",
    14: "56px",
    16: "64px",
    20: "80px",
    24: "96px",
    28: "112px",
    32: "128px",
    36: "144px",
    40: "160px",
    44: "176px",
    48: "192px",
    52: "208px",
    56: "224px",
    60: "240px",
    64: "256px",
    72: "288px",
    80: "320px",
    96: "384px"
};
const fontSize = {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
    "7xl": "4.5rem",
    "8xl": "6rem",
    "9xl": "8rem"
};
const fontWeight = {
    thin: "100",
    extralight: "200",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900"
};
const borderRadius = {
    none: "0px",
    sm: "2px",
    DEFAULT: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    "2xl": "16px",
    "3xl": "24px",
    full: "9999px"
};
const boxShadow = {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "0 0 #0000"
};

;// CONCATENATED MODULE: ../../packages/ui/src/index.ts












/***/ })

};
;