"use strict";
exports.id = 126;
exports.ids = [126];
exports.modules = {

/***/ 6126:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MS": () => (/* binding */ ApiError),
/* harmony export */   "hi": () => (/* binding */ api),
/* harmony export */   "yE": () => (/* binding */ clearTokens)
/* harmony export */ });
// In production the API is served by the same Vercel deployment under /api,
// so we use a relative base. Locally, set NEXT_PUBLIC_API_URL to override
// (e.g. http://localhost:3001) — see next.config.mjs rewrites.
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1`;
function getStoredTokens() {
    try {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        if (accessToken && refreshToken) return {
            accessToken,
            refreshToken
        };
        return null;
    } catch  {
        return null;
    }
}
function storeTokens(tokens) {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
}
function clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
}
let isRefreshing = false;
let refreshPromise = null;
async function refreshTokens() {
    if (isRefreshing && refreshPromise) return refreshPromise;
    isRefreshing = true;
    refreshPromise = (async ()=>{
        const tokens = getStoredTokens();
        if (!tokens) return false;
        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refreshToken: tokens.refreshToken
                })
            });
            if (!res.ok) {
                clearTokens();
                return false;
            }
            const data = await res.json();
            const newTokens = {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken || tokens.refreshToken
            };
            storeTokens(newTokens);
            return true;
        } catch  {
            clearTokens();
            return false;
        } finally{
            isRefreshing = false;
            refreshPromise = null;
        }
    })();
    return refreshPromise;
}
class ApiError extends Error {
    constructor(message, status, code){
        super(message);
        this.status = status;
        this.code = code;
        this.name = "ApiError";
    }
}
async function request(url, options = {}) {
    let tokens = getStoredTokens();
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };
    if (tokens?.accessToken) headers["Authorization"] = `Bearer ${tokens.accessToken}`;
    let res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers
    });
    if (res.status === 401 && tokens?.refreshToken) {
        const refreshed = await refreshTokens();
        if (refreshed) {
            tokens = getStoredTokens();
            if (tokens?.accessToken) headers["Authorization"] = `Bearer ${tokens.accessToken}`;
            res = await fetch(`${API_BASE}${url}`, {
                ...options,
                headers
            });
        } else {
            clearTokens();
            window.location.href = "/auth/login";
            throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
        }
    }
    if (res.status === 204) return undefined;
    const data = await res.json();
    if (!res.ok) {
        throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code);
    }
    return data;
}
const api = {
    get: (url)=>request(url),
    post: (url, body)=>request(url, {
            method: "POST",
            body: body ? JSON.stringify(body) : undefined
        }),
    put: (url, body)=>request(url, {
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined
        }),
    patch: (url, body)=>request(url, {
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined
        }),
    delete: (url)=>request(url, {
            method: "DELETE"
        })
};


/***/ })

};
;