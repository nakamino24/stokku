(() => {
var exports = {};
exports.id = 888;
exports.ids = [888];
exports.modules = {

/***/ 664:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "S": () => (/* binding */ ErrorBoundary)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7458);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);


class ErrorBoundary extends react__WEBPACK_IMPORTED_MODULE_1__.Component {
    constructor(props){
        super(props);
        this.state = {
            hasError: false
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback || /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                style: {
                    padding: "2rem",
                    textAlign: "center"
                },
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                        children: "Something went wrong"
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                        style: {
                            color: "#666"
                        },
                        children: this.state.error?.message
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                        onClick: ()=>{
                            this.setState({
                                hasError: false,
                                error: undefined
                            });
                            window.location.reload();
                        },
                        style: {
                            marginTop: "1rem",
                            padding: "0.5rem 1rem"
                        },
                        children: "Reload page"
                    })
                ]
            });
        }
        return this.props.children;
    }
}


/***/ }),

/***/ 4286:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7458);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _Sidebar__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9360);
/* harmony import */ var react_icons_fi__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1780);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_Sidebar__WEBPACK_IMPORTED_MODULE_2__, react_icons_fi__WEBPACK_IMPORTED_MODULE_3__]);
([_Sidebar__WEBPACK_IMPORTED_MODULE_2__, react_icons_fi__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);




const MainLayout = ({ children  })=>{
    const [sidebarOpen, setSidebarOpen] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex min-h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "w-60 flex-shrink-0 bg-white border-r border-gray-200 fixed top-0 left-0 bottom-0 overflow-y-auto z-30",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_Sidebar__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .Z, {
                    isOpen: sidebarOpen,
                    onClose: ()=>setSidebarOpen(false)
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "flex-1 min-h-screen lg:ml-60",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("header", {
                        className: "h-16 bg-white border-b border-gray-200 flex items-center justify-between lg:justify-end px-4 lg:px-6 gap-3 sticky top-0 z-20",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                                onClick: ()=>setSidebarOpen(true),
                                className: "lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all",
                                "aria-label": "Open menu",
                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiMenu, {
                                    size: 20
                                })
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                                        className: "p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all",
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiBell, {
                                            size: 18
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-semibold",
                                        children:  false || "U"
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("main", {
                        className: "p-4 lg:p-6 max-w-7xl mx-auto",
                        children: children
                    })
                ]
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MainLayout);

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 9360:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7458);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1165);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1853);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_icons_fi__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1780);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6126);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_icons_fi__WEBPACK_IMPORTED_MODULE_3__]);
react_icons_fi__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];





const navigation = [
    {
        section: "Overview",
        items: [
            {
                href: "/",
                label: "Dashboard",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiHome
            }
        ]
    },
    {
        section: "Inventory",
        items: [
            {
                href: "/products",
                label: "Products",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiPackage
            },
            {
                href: "/categories",
                label: "Categories",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiGrid
            },
            {
                href: "/stock",
                label: "Stock Levels",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiLayers
            }
        ]
    },
    {
        section: "Warehouses",
        items: [
            {
                href: "/warehouses",
                label: "Warehouses",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiArchive
            }
        ]
    },
    {
        section: "Purchasing",
        items: [
            {
                href: "/purchase-orders",
                label: "Purchase Orders",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiShoppingCart
            },
            {
                href: "/suppliers",
                label: "Suppliers",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiTruck
            }
        ]
    },
    {
        section: "Sales",
        items: [
            {
                href: "/sales-orders",
                label: "Sales Orders",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiFileText
            },
            {
                href: "/customers",
                label: "Customers",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiUserCheck
            }
        ]
    },
    {
        section: "Reports",
        items: [
            {
                href: "/reports",
                label: "Reports",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiBarChart2
            }
        ]
    },
    {
        section: "Administration",
        items: [
            {
                href: "/users",
                label: "Users",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiUsers
            },
            {
                href: "/settings",
                label: "Settings",
                icon: react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiSettings
            }
        ]
    }
];
const Sidebar = ({ isOpen , onClose  })=>{
    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
    const isActive = (path)=>{
        if (path === "/") return router.pathname === "/";
        return router.pathname.startsWith(path);
    };
    const handleLogout = ()=>{
        (0,_utils_api__WEBPACK_IMPORTED_MODULE_4__/* .clearTokens */ .yE)();
        localStorage.removeItem("user");
        router.push("/auth/login");
    };
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: [
            isOpen && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "fixed inset-0 bg-black/40 z-40 lg:hidden",
                onClick: onClose,
                "aria-hidden": "true"
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                className: `
        flex flex-col h-full p-4 gap-1
        fixed lg:static inset-y-0 left-0 z-50 w-60
        bg-white border-r border-gray-200
        transition-transform duration-200
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `,
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "flex items-center gap-3 px-3 py-2 mb-4",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                className: "w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm",
                                children: "S"
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                className: "text-lg font-bold text-gray-900",
                                children: "Stokku"
                            })
                        ]
                    }),
                    navigation.map((group)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400 px-3 py-1.5 mt-2",
                                    children: group.section
                                }),
                                group.items.map((item)=>{
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {
                                        href: item.href,
                                        className: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${active ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`,
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(Icon, {
                                                size: 17
                                            }),
                                            item.label
                                        ]
                                    }, item.href);
                                })
                            ]
                        }, group.section)),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "flex-1"
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", {
                        onClick: handleLogout,
                        className: "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150 w-full text-left",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_icons_fi__WEBPACK_IMPORTED_MODULE_3__.FiLogOut, {
                                size: 17
                            }),
                            "Logout"
                        ]
                    })
                ]
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Sidebar);

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 863:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ App)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7458);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1853);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_layout_MainLayout__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4286);
/* harmony import */ var _components_ErrorBoundary__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(664);
/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(5573);
/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_5__);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_components_layout_MainLayout__WEBPACK_IMPORTED_MODULE_3__]);
_components_layout_MainLayout__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];






const publicPaths = [
    "/auth/login",
    "/auth/register"
];
function LoadingScreen() {
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "#f8f9fa"
        },
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                style: {
                    textAlign: "center"
                },
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        style: {
                            width: 32,
                            height: 32,
                            border: "3px solid #e0e0e0",
                            borderTopColor: "#3b82f6",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                            margin: "0 auto 1rem"
                        }
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                        style: {
                            color: "#666",
                            fontSize: "0.875rem"
                        },
                        children: "Loading..."
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("style", {
                children: `@keyframes spin { to { transform: rotate(360deg); } }`
            })
        ]
    });
}
function RouteLoadingBar() {
    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_1__.useRouter)();
    const [visible, setVisible] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        const start = ()=>setVisible(true);
        const end = ()=>setVisible(false);
        router.events.on("routeChangeStart", start);
        router.events.on("routeChangeComplete", end);
        router.events.on("routeChangeError", end);
        return ()=>{
            router.events.off("routeChangeStart", start);
            router.events.off("routeChangeComplete", end);
            router.events.off("routeChangeError", end);
        };
    }, [
        router.events
    ]);
    if (!visible) return null;
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            height: 3,
            backgroundColor: "#6366f1",
            animation: "routeBar 2s ease-in-out infinite"
        },
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("style", {
            children: `@keyframes routeBar { 0% { width: 0; } 50% { width: 60%; } 100% { width: 100%; } }`
        })
    });
}
function App({ Component , pageProps  }) {
    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_1__.useRouter)();
    const [isAuth, setIsAuth] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(null);
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        const token = localStorage.getItem("accessToken");
        setIsAuth(!!token);
        if (!token && !publicPaths.includes(router.pathname)) {
            router.replace("/auth/login");
        }
    }, [
        router.pathname
    ]);
    if (isAuth === null) return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(LoadingScreen, {});
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ErrorBoundary__WEBPACK_IMPORTED_MODULE_4__/* .ErrorBoundary */ .S, {
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(RouteLoadingBar, {}),
            publicPaths.includes(router.pathname) || !isAuth ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(Component, {
                ...pageProps
            }) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_layout_MainLayout__WEBPACK_IMPORTED_MODULE_3__/* ["default"] */ .Z, {
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(Component, {
                    ...pageProps
                })
            })
        ]
    });
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 5573:
/***/ (() => {



/***/ }),

/***/ 3280:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/app-router-context.js");

/***/ }),

/***/ 4964:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router-context.js");

/***/ }),

/***/ 1751:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/add-path-prefix.js");

/***/ }),

/***/ 3938:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/format-url.js");

/***/ }),

/***/ 1109:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/is-local-url.js");

/***/ }),

/***/ 8854:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/parse-path.js");

/***/ }),

/***/ 3297:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/remove-trailing-slash.js");

/***/ }),

/***/ 7782:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/resolve-href.js");

/***/ }),

/***/ 9232:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/utils.js");

/***/ }),

/***/ 1853:
/***/ ((module) => {

"use strict";
module.exports = require("next/router");

/***/ }),

/***/ 6689:
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ 1780:
/***/ ((module) => {

"use strict";
module.exports = import("react-icons/fi");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [458,165,126], () => (__webpack_exec__(863)));
module.exports = __webpack_exports__;

})();