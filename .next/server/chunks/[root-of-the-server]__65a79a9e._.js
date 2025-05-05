module.exports = {

"[project]/.next-internal/server/app/api/whatsapp/contacts/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[project]/src/lib/whatsapp/whatsapp.client.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
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
"[project]/src/app/api/whatsapp/contacts/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// src/app/api/whatsapp/contacts/route.ts
__turbopack_context__.s({
    "GET": (()=>GET),
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2f$whatsapp$2e$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp/whatsapp.client.ts [app-route] (ecmascript)");
;
;
async function GET() {
    const client = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2f$whatsapp$2e$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"]();
    try {
        // Mock para pruebas (reemplázalo con tu lógica real)
        const mockContacts = [
            {
                id: "1234567890",
                name: "Cliente Ejemplo",
                lastMessage: "Hola, ¿cómo estás?",
                unread: 2,
                lastMessageTime: new Date().toISOString()
            }
        ];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(mockContacts);
    // Para producción, usa esto:
    // const contacts = await client.getContacts();
    // return NextResponse.json(contacts);
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error al obtener contactos'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    // Implementa según tus necesidades
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'Método no implementado'
    }, {
        status: 501
    });
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__65a79a9e._.js.map