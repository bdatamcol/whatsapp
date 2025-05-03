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
            'Authorization': `Bearer ${"TURBOPACK compile-time value", "EAAdmskc6SHwBOZBQ9dOFTqAUZCCyIWZCRpImZBAWx9HkZBZAZAMqvAh33jZCqKvfTy3xuGShdvSHjb5IZBEWqZBbD3FBbaX1qXg8GZBNKzkG6P8YZAxjKHcZBKnKvRSeQLNwaQJXvTSsXJZAc4KB1rfojjaL0jRQtWpXw7D1EZCrqNuMPcAq5yNxuOPv2mAqhfRGQXh2Sb5J2JKMcIX13kocYmFFzU5fkmHyRAZD"}`,
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
"[project]/src/app/providers/WhatsAppProvider.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "WhatsAppProvider": (()=>WhatsAppProvider),
    "useWhatsApp": (()=>useWhatsApp)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2f$whatsapp$2e$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp/whatsapp.client.ts [app-ssr] (ecmascript)");
'use client';
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
    // 1. Carga contactos desde tu API (reemplaza el mock)
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
    // 2. Envía mensajes usando WhatsAppClient
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (message)=>{
        if (!state.selectedContact || !message.trim()) return;
        setState((prev)=>({
                ...prev,
                loading: true,
                error: null
            }));
        try {
            // Usa el cliente para enviar el mensaje
            await whatsapp.sendText(state.selectedContact, message);
            // Actualiza el estado local
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
    // 3. Selecciona un contacto y carga sus mensajes
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
    // 4. Carga más mensajes antiguos (paginación)
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
    // Carga inicial de contactos
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
        lineNumber: 113,
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
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
} else {
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    } else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else {
                "TURBOPACK unreachable";
            }
        } else {
            "TURBOPACK unreachable";
        }
    }
} //# sourceMappingURL=module.compiled.js.map
}}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__d6be9c16._.js.map