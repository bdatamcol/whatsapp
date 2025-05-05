(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/whatsapp/whatsapp.client.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>WhatsAppClient)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/providers/WhatsAppProvider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// app/providers/WhatsAppProvider.tsx
__turbopack_context__.s({
    "WhatsAppProvider": (()=>WhatsAppProvider),
    "useWhatsApp": (()=>useWhatsApp)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2f$whatsapp$2e$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp/whatsapp.client.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const WhatsAppContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const WhatsAppProvider = ({ children })=>{
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        contacts: [],
        messages: [],
        selectedContact: null,
        loading: false,
        error: null
    });
    const whatsapp = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2f$whatsapp$2e$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]();
    // Conexión con Socket.io para actualización en tiempo real
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WhatsAppProvider.useEffect": ()=>{
            const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
            socket.on('newMessage', {
                "WhatsAppProvider.useEffect": (newMessage)=>{
                    setState({
                        "WhatsAppProvider.useEffect": (prev)=>({
                                ...prev,
                                messages: [
                                    ...prev.messages,
                                    newMessage
                                ]
                            })
                    }["WhatsAppProvider.useEffect"]);
                }
            }["WhatsAppProvider.useEffect"]);
            return ({
                "WhatsAppProvider.useEffect": ()=>{
                    socket.disconnect();
                }
            })["WhatsAppProvider.useEffect"];
        }
    }["WhatsAppProvider.useEffect"], []);
    const loadContacts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WhatsAppProvider.useCallback[loadContacts]": async ()=>{
            setState({
                "WhatsAppProvider.useCallback[loadContacts]": (prev)=>({
                        ...prev,
                        loading: true,
                        error: null
                    })
            }["WhatsAppProvider.useCallback[loadContacts]"]);
            try {
                const response = await fetch('/api/whatsapp/contacts');
                if (!response.ok) throw new Error('Error al cargar contactos');
                const contacts = await response.json();
                setState({
                    "WhatsAppProvider.useCallback[loadContacts]": (prev)=>({
                            ...prev,
                            contacts,
                            loading: false
                        })
                }["WhatsAppProvider.useCallback[loadContacts]"]);
            } catch (error) {
                setState({
                    "WhatsAppProvider.useCallback[loadContacts]": (prev)=>({
                            ...prev,
                            error: 'Error al cargar contactos',
                            loading: false
                        })
                }["WhatsAppProvider.useCallback[loadContacts]"]);
            }
        }
    }["WhatsAppProvider.useCallback[loadContacts]"], []);
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WhatsAppProvider.useCallback[sendMessage]": async (message)=>{
            if (!state.selectedContact || !message.trim()) return;
            setState({
                "WhatsAppProvider.useCallback[sendMessage]": (prev)=>({
                        ...prev,
                        loading: true,
                        error: null
                    })
            }["WhatsAppProvider.useCallback[sendMessage]"]);
            try {
                await whatsapp.sendText(state.selectedContact, message);
                const newMsg = {
                    id: Date.now().toString(),
                    text: message,
                    timestamp: new Date().toISOString(),
                    direction: 'outbound',
                    status: 'sent'
                };
                setState({
                    "WhatsAppProvider.useCallback[sendMessage]": (prev)=>({
                            ...prev,
                            messages: [
                                ...prev.messages,
                                newMsg
                            ],
                            loading: false
                        })
                }["WhatsAppProvider.useCallback[sendMessage]"]);
            } catch (error) {
                setState({
                    "WhatsAppProvider.useCallback[sendMessage]": (prev)=>({
                            ...prev,
                            error: 'Error al enviar mensaje',
                            loading: false
                        })
                }["WhatsAppProvider.useCallback[sendMessage]"]);
            }
        }
    }["WhatsAppProvider.useCallback[sendMessage]"], [
        state.selectedContact
    ]);
    const selectContact = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WhatsAppProvider.useCallback[selectContact]": async (phone)=>{
            setState({
                "WhatsAppProvider.useCallback[selectContact]": (prev)=>({
                        ...prev,
                        selectedContact: phone,
                        loading: true,
                        error: null
                    })
            }["WhatsAppProvider.useCallback[selectContact]"]);
            try {
                const response = await fetch(`/api/whatsapp/messages?contact=${phone}`);
                if (!response.ok) throw new Error('Error al cargar mensajes');
                const messages = await response.json();
                setState({
                    "WhatsAppProvider.useCallback[selectContact]": (prev)=>({
                            ...prev,
                            messages,
                            loading: false
                        })
                }["WhatsAppProvider.useCallback[selectContact]"]);
            } catch (error) {
                setState({
                    "WhatsAppProvider.useCallback[selectContact]": (prev)=>({
                            ...prev,
                            error: 'Error al cargar mensajes',
                            loading: false
                        })
                }["WhatsAppProvider.useCallback[selectContact]"]);
            }
        }
    }["WhatsAppProvider.useCallback[selectContact]"], []);
    const loadMoreMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WhatsAppProvider.useCallback[loadMoreMessages]": async ()=>{
            if (!state.selectedContact) return;
            setState({
                "WhatsAppProvider.useCallback[loadMoreMessages]": (prev)=>({
                        ...prev,
                        loading: true,
                        error: null
                    })
            }["WhatsAppProvider.useCallback[loadMoreMessages]"]);
            try {
                const oldestMessage = state.messages[0];
                const response = await fetch(`/api/whatsapp/messages?contact=${state.selectedContact}&before=${oldestMessage.timestamp}`);
                const olderMessages = await response.json();
                setState({
                    "WhatsAppProvider.useCallback[loadMoreMessages]": (prev)=>({
                            ...prev,
                            messages: [
                                ...olderMessages,
                                ...prev.messages
                            ],
                            loading: false
                        })
                }["WhatsAppProvider.useCallback[loadMoreMessages]"]);
            } catch (error) {
                setState({
                    "WhatsAppProvider.useCallback[loadMoreMessages]": (prev)=>({
                            ...prev,
                            error: 'Error al cargar más mensajes',
                            loading: false
                        })
                }["WhatsAppProvider.useCallback[loadMoreMessages]"]);
            }
        }
    }["WhatsAppProvider.useCallback[loadMoreMessages]"], [
        state.selectedContact,
        state.messages
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WhatsAppProvider.useEffect": ()=>{
            loadContacts();
        }
    }["WhatsAppProvider.useEffect"], [
        loadContacts
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WhatsAppContext.Provider, {
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
_s(WhatsAppProvider, "+BFK+/vQKp7yn1G2sY5gtTUY1sY=");
_c = WhatsAppProvider;
const useWhatsApp = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(WhatsAppContext);
    if (!context) {
        throw new Error('useWhatsApp debe usarse dentro de WhatsAppProvider');
    }
    return context;
};
_s1(useWhatsApp, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "WhatsAppProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/providers/Providers.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Providers": (()=>Providers)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$providers$2f$WhatsAppProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/providers/WhatsAppProvider.tsx [app-client] (ecmascript)"); // CORREGIDO: sin /app
'use client'; // Solo este archivo es cliente
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$providers$2f$WhatsAppProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WhatsAppProvider"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/src/app/providers/Providers.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = Providers;
var _c;
__turbopack_context__.k.register(_c, "Providers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_f7dc84c0._.js.map