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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/providers/WhatsAppProvider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "WhatsAppProvider": (()=>WhatsAppProvider),
    "useWhatsApp": (()=>useWhatsApp)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2f$whatsapp$2e$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp/whatsapp.client.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
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
    // 1. Carga contactos desde tu API (reemplaza el mock)
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
    // 2. Envía mensajes usando WhatsAppClient
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
    // 3. Selecciona un contacto y carga sus mensajes
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
    // 4. Carga más mensajes antiguos (paginación)
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
    // Carga inicial de contactos
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
        lineNumber: 113,
        columnNumber: 5
    }, this);
};
_s(WhatsAppProvider, "K7Rg562r822SL6dCvPaLtRUvOTk=");
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
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return (type.displayName || "Context") + ".Provider";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, self, source, owner, props, debugStack, debugTask) {
        self = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== self ? self : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, source, self, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, self, source, getOwner(), maybeKey, debugStack, debugTask);
    }
    function validateChildKeys(node) {
        "object" === typeof node && null !== node && node.$$typeof === REACT_ELEMENT_TYPE && node._store && (node._store.validated = 1);
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler");
    Symbol.for("react.provider");
    var REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        "react-stack-bottom-frame": function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React["react-stack-bottom-frame"].bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren, source, self) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, source, self, trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
} else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}}),
}]);

//# sourceMappingURL=_c2f9ae88._.js.map