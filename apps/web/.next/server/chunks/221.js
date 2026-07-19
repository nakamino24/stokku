"use strict";
exports.id = 221;
exports.ids = [221];
exports.modules = {

/***/ 6070:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Y": () => (/* binding */ AuthInput)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7458);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_icons_fi__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1780);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_icons_fi__WEBPACK_IMPORTED_MODULE_2__]);
react_icons_fi__WEBPACK_IMPORTED_MODULE_2__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];



const AuthInput = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)(({ label , error , icon: Icon , type ="text" , id , className , ...props }, ref)=>{
    const [showPassword, setShowPassword] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const inputType = isPassword ? showPassword ? "text" : "password" : type;
    const [focused, setFocused] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "space-y-1.5",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("label", {
                htmlFor: inputId,
                className: "block text-sm font-medium",
                style: {
                    color: "#1e293b"
                },
                children: label
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "relative",
                children: [
                    Icon && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none",
                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(Icon, {
                            className: `w-4 h-4 ${focused ? "text-indigo-500" : "text-slate-400"}`
                        })
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("input", {
                        ref: ref,
                        id: inputId,
                        type: inputType,
                        autoComplete: isPassword ? "current-password" : type === "email" ? "email" : undefined,
                        onFocus: (e)=>{
                            setFocused(true);
                            props.onFocus?.(e);
                        },
                        onBlur: (e)=>{
                            setFocused(false);
                            props.onBlur?.(e);
                        },
                        className: `
              block w-full rounded-lg border bg-white text-sm
              transition-all duration-150
              placeholder:text-slate-400
              ${Icon ? "pl-10" : "pl-3.5"} pr-10 py-2.5
              ${error ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"}
              ${className || ""}
            `,
                        style: {
                            outline: "none",
                            color: "#0f172a",
                            height: "44px"
                        },
                        ...props
                    }),
                    isPassword && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                        type: "button",
                        onClick: ()=>setShowPassword(!showPassword),
                        className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors",
                        tabIndex: -1,
                        "aria-label": showPassword ? "Hide password" : "Show password",
                        children: showPassword ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_2__.FiEyeOff, {
                            className: "w-4 h-4"
                        }) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_2__.FiEye, {
                            className: "w-4 h-4"
                        })
                    })
                ]
            }),
            error && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                className: "text-xs text-red-500 mt-1 animate-fade-in",
                children: error
            })
        ]
    });
});
AuthInput.displayName = "AuthInput";

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 2555:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (/* binding */ AuthLayout)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7458);
/* harmony import */ var _BrandPanel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(431);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_BrandPanel__WEBPACK_IMPORTED_MODULE_1__]);
_BrandPanel__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];


function AuthLayout({ children  }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex min-h-screen",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "absolute inset-0",
                        style: {
                            backgroundImage: `
              radial-gradient(circle at 30% 70%, rgba(99,102,241,0.08) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(129,140,248,0.06) 0%, transparent 50%)
            `
                        }
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_BrandPanel__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z, {})
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "flex-1 flex items-center justify-center px-6 py-12 lg:px-12 bg-surface-secondary",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "w-full max-w-md animate-scale-in",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "lg:hidden flex items-center gap-2.5 mb-10 justify-center",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "flex items-center justify-center w-8 h-8 rounded-lg",
                                    style: {
                                        background: "linear-gradient(135deg, #6366f1, #4f46e5)"
                                    },
                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                        className: "text-white text-sm font-bold",
                                        children: "S"
                                    })
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                    className: "text-slate-900 text-lg font-semibold",
                                    children: "Stokku"
                                })
                            ]
                        }),
                        children
                    ]
                })
            })
        ]
    });
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 431:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (/* binding */ BrandPanel)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7458);
/* harmony import */ var react_icons_fi__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1780);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_icons_fi__WEBPACK_IMPORTED_MODULE_1__]);
react_icons_fi__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];


function BrandPanel() {
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "relative flex flex-col justify-between h-full px-10 py-12",
        style: {
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)"
        },
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "absolute inset-0 opacity-[0.03]",
                style: {
                    backgroundImage: `
            radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, #4f46e5 0%, transparent 50%)
          `
                }
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "relative z-10",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "flex items-center gap-3 mb-10",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                className: "flex items-center justify-center w-10 h-10 rounded-xl",
                                style: {
                                    background: "linear-gradient(135deg, #6366f1, #4f46e5)"
                                },
                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                    className: "text-white text-lg font-bold",
                                    children: "S"
                                })
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                className: "text-white text-xl font-semibold tracking-tight",
                                children: "Stokku"
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h1", {
                        className: "text-white text-3xl font-bold leading-tight mb-4 tracking-tight",
                        children: [
                            "Simple inventory management",
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("br", {}),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                style: {
                                    color: "#a5b4fc"
                                },
                                children: "for growing businesses"
                            })
                        ]
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                        className: "text-slate-400 text-base leading-relaxed mb-10 max-w-sm",
                        children: "Stop losing stock, wasting time on spreadsheets, and dealing with inaccurate counts. Stokku gives you real-time visibility into every item in every location."
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "space-y-5",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(BenefitRow, {
                                icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_1__.FiRefreshCw, {
                                    className: "w-4 h-4 text-indigo-300"
                                }),
                                text: "Track stock in real time across all locations",
                                delay: 400
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(BenefitRow, {
                                icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_1__.FiShield, {
                                    className: "w-4 h-4 text-indigo-300"
                                }),
                                text: "Reduce discrepancies with cycle counts",
                                delay: 550
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(BenefitRow, {
                                icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_1__.FiUsers, {
                                    className: "w-4 h-4 text-indigo-300"
                                }),
                                text: "Manage inventory with your team",
                                delay: 700
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "relative z-10 flex items-center gap-2 text-slate-500 text-xs",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_1__.FiLock, {
                        className: "w-3 h-3"
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                        children: "Secured with 256-bit encryption"
                    })
                ]
            })
        ]
    });
}
function BenefitRow({ icon , text , delay  }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex items-center gap-3.5 animate-fade-in",
        style: {
            animationDelay: `${delay}ms`,
            animationFillMode: "both"
        },
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 shrink-0",
                children: icon
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                className: "text-slate-300 text-sm",
                children: text
            })
        ]
    });
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
;