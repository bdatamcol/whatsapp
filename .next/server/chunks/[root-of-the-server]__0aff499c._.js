module.exports = {

"[project]/.next-internal/server/app/api/marketing/account/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

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
"[project]/src/app/api/marketing/account/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// app/api/marketing/account/route.ts
__turbopack_context__.s({
    "GET": (()=>GET),
    "dynamic": (()=>dynamic)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const dynamic = 'force-dynamic';
async function GET() {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const accountId = process.env.MARKETING_ACCOUNT_ID;
    const version = process.env.META_API_VERSION || 'v17.0';
    if (!accessToken || !accountId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: 'Faltan credenciales'
        }, {
            status: 400
        });
    }
    try {
        // Obtener datos del Ad Account
        const accountRes = await fetch(`https://graph.facebook.com/${version}/${accountId}?fields=name,account_status&access_token=${accessToken}`);
        const accountData = await accountRes.json();
        // Obtener lista de páginas asociadas
        // Modificar el fetch de páginas para incluir force_token
        const pagesRes = await fetch(`https://graph.facebook.com/${version}/me/accounts?fields=id,name,category,username,access_token&access_token=${accessToken}&force_token=page`);
        const pagesList = await pagesRes.json();
        if (!pagesList?.data) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: 'No se encontraron páginas'
            }, {
                status: 404
            });
        }
        // Para cada página, obtener detalles con su Page Access Token
        const detailedPages = await Promise.all(pagesList.data.map(async (page)=>{
            if (!page.access_token) return page;
            try {
                const detailRes = await fetch(`https://graph.facebook.com/${version}/${page.id}?fields=fan_count&access_token=${page.access_token}`);
                const detailData = await detailRes.json();
                // Agregar en el return de detailedPages
                return {
                    ...page,
                    fan_count: detailData?.fan_count ?? 0,
                    access_token: page.access_token.substring(0, 15) + '...' // Solo para debug
                };
            } catch (err) {
                console.error(`Error obteniendo fan_count para ${page.name}`, err);
                return page;
            }
        }));
        // app/api/marketing/account/route.ts
        // ... (código existente)
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            account: accountData,
            pages: detailedPages.map((page)=>({
                    id: page.id,
                    name: page.name,
                    category: page.category,
                    username: page.username,
                    fan_count: page.fan_count,
                    access_token: page.access_token // Asegurarnos que se incluye
                }))
        });
    } catch (error) {
        console.error('Error al obtener datos del marketing account:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: 'Error interno del servidor'
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__0aff499c._.js.map