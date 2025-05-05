module.exports = {

"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[project]/src/lib/whatsapp/whatsapp.client.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>WhatsAppClient)
});
'use strict';
const API_VERSION = 'v19.0';
class WhatsAppClient {
    baseUrl;
    constructor(){
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        this.baseUrl = `https://graph.facebook.com/${API_VERSION}/${"TURBOPACK compile-time value", "573143728457"}`;
    }
    // src/lib/whatsapp/whatsapp.client.ts
    async getContacts() {
        try {
            // En producción, aquí llamarías a la API de WhatsApp/Meta
            // Pero para desarrollo, podemos simular datos o conectar a una DB
            const mockContacts = [
                {
                    id: "521234567890",
                    name: "Cliente Ejemplo",
                    lastMessage: "Hola, ¿cómo estás?",
                    unread: 2,
                    lastMessageTime: new Date()
                }
            ];
            return mockContacts;
        // Para conexión real con WhatsApp API (descomentar cuando esté listo):
        // const response = await fetch(`${this.baseUrl}/contacts`, {
        //   headers: this.getHeaders()
        // });
        // return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            throw error;
        }
    }
    async sendText(to, message) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                text: {
                    body: message
                }
            })
        });
        return this.handleResponse(response);
    }
    getHeaders() {
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        return {
            'Authorization': `Bearer ${"TURBOPACK compile-time value", "EAAdmskc6SHwBOwkfZBydXz72RkdMqZChVuulyksXDsI2WYmuZAFCC7VzyDj41eUWMyk8PdMKmgZBKuyCNNqaQ0owatZA2bFSK1n1pv74WCcaqAZB92sSaaweZAFAlpmuTWLcSxlcmIDJXWuAVuMVe1KJeUkDBXbHsl0JyTGRSr2potjYzZAbv44yyR4Wp6XFcqXVo4RqIWstZCLICrSyM8a5ojKhwTurn"}`,
            'Content-Type': 'application/json'
        };
    }
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json();
            console.error('WhatsApp API Error:', error);
            throw new Error(error.error?.message || 'WhatsApp API error');
        }
        return response.json();
    }
} // 🔥 Nada más después de aquí. ¡No más module.exports!
}}),
"[externals]/fs [external] (fs, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}}),
"[externals]/url [external] (url, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}}),
"[externals]/child_process [external] (child_process, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}}),
"[externals]/http [external] (http, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}}),
"[externals]/https [external] (https, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}}),
"[externals]/tty [external] (tty, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}}),
"[externals]/util [external] (util, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}}),
"[externals]/os [external] (os, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[externals]/zlib [external] (zlib, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}}),
"[externals]/buffer [external] (buffer, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[externals]/events [external] (events, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}}),
"[externals]/net [external] (net, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}}),
"[externals]/tls [external] (tls, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}}),
"[project]/src/app/providers/WhatsAppProvider.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// app/providers/WhatsAppProvider.tsx
__turbopack_context__.s({
    "WhatsAppProvider": (()=>WhatsAppProvider),
    "useWhatsApp": (()=>useWhatsApp)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2f$whatsapp$2e$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp/whatsapp.client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2d$debug$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm-debug/index.js [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2d$debug$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm-debug/index.js [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
;
const WhatsAppContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const WhatsAppProvider = ({ children })=>{
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        contacts: [],
        messages: [],
        selectedContact: null,
        loading: false,
        error: null
    });
    const whatsapp = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2f$whatsapp$2e$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]();
    // Conexión con Socket.io para actualización en tiempo real
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2d$debug$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
        socket.on('newMessage', (newMessage)=>{
            setState((prev)=>({
                    ...prev,
                    messages: [
                        ...prev.messages,
                        newMessage
                    ]
                }));
        });
        return ()=>{
            socket.disconnect();
        };
    }, []);
    const loadContacts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        setState((prev)=>({
                ...prev,
                loading: true,
                error: null
            }));
        try {
            const response = await fetch('/api/whatsapp/contacts');
            if (!response.ok) throw new Error('Error al cargar contactos');
            const contacts = await response.json();
            setState((prev)=>({
                    ...prev,
                    contacts,
                    loading: false
                }));
        } catch (error) {
            setState((prev)=>({
                    ...prev,
                    error: 'Error al cargar contactos',
                    loading: false
                }));
        }
    }, []);
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (message)=>{
        if (!state.selectedContact || !message.trim()) return;
        setState((prev)=>({
                ...prev,
                loading: true,
                error: null
            }));
        try {
            await whatsapp.sendText(state.selectedContact, message);
            const newMsg = {
                id: Date.now().toString(),
                text: message,
                timestamp: new Date().toISOString(),
                direction: 'outbound',
                status: 'sent'
            };
            setState((prev)=>({
                    ...prev,
                    messages: [
                        ...prev.messages,
                        newMsg
                    ],
                    loading: false
                }));
        } catch (error) {
            setState((prev)=>({
                    ...prev,
                    error: 'Error al enviar mensaje',
                    loading: false
                }));
        }
    }, [
        state.selectedContact
    ]);
    const selectContact = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (phone)=>{
        setState((prev)=>({
                ...prev,
                selectedContact: phone,
                loading: true,
                error: null
            }));
        try {
            const response = await fetch(`/api/whatsapp/messages?contact=${phone}`);
            if (!response.ok) throw new Error('Error al cargar mensajes');
            const messages = await response.json();
            setState((prev)=>({
                    ...prev,
                    messages,
                    loading: false
                }));
        } catch (error) {
            setState((prev)=>({
                    ...prev,
                    error: 'Error al cargar mensajes',
                    loading: false
                }));
        }
    }, []);
    const loadMoreMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!state.selectedContact) return;
        setState((prev)=>({
                ...prev,
                loading: true,
                error: null
            }));
        try {
            const oldestMessage = state.messages[0];
            const response = await fetch(`/api/whatsapp/messages?contact=${state.selectedContact}&before=${oldestMessage.timestamp}`);
            const olderMessages = await response.json();
            setState((prev)=>({
                    ...prev,
                    messages: [
                        ...olderMessages,
                        ...prev.messages
                    ],
                    loading: false
                }));
        } catch (error) {
            setState((prev)=>({
                    ...prev,
                    error: 'Error al cargar más mensajes',
                    loading: false
                }));
        }
    }, [
        state.selectedContact,
        state.messages
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadContacts();
    }, [
        loadContacts
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(WhatsAppContext.Provider, {
        value: {
            ...state,
            selectContact,
            sendMessage,
            refreshContacts: loadContacts,
            loadMoreMessages
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/app/providers/WhatsAppProvider.tsx",
        lineNumber: 125,
        columnNumber: 5
    }, this);
};
const useWhatsApp = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(WhatsAppContext);
    if (!context) {
        throw new Error('useWhatsApp debe usarse dentro de WhatsAppProvider');
    }
    return context;
};
}}),
"[project]/src/app/providers/Providers.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Providers": (()=>Providers)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$providers$2f$WhatsAppProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/providers/WhatsAppProvider.tsx [app-ssr] (ecmascript)"); // CORREGIDO: sin /app
'use client'; // Solo este archivo es cliente
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$providers$2f$WhatsAppProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WhatsAppProvider"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/src/app/providers/Providers.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__1eacab46._.js.map