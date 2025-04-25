module.exports = {

"[project]/.next-internal/server/app/api/marketing/insights/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

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
"[project]/src/app/api/marketing/insights/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "GET": (()=>GET)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20'; // Por defecto 10 campañas
    const after = searchParams.get('after') || ''; // Cursor para paginación
    try {
        const url = `https://graph.facebook.com/v17.0/act_${process.env.FACEBOOK_AD_ACCOUNT_ID}/insights` + `?fields=date_start,date_stop,spend,impressions,reach,clicks,unique_clicks,cpc,ctr,frequency,campaign_name,adset_name,ad_name,actions` + `&level=ad` + `&limit=${limit}` + `&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}` + (after ? `&after=${after}` : '');
        const response = await fetch(url, {
            method: 'GET'
        });
        console.log('Status Code:', response.status);
        if (!response.ok) {
            const errorMessage = await response.json();
            console.log('Error Message:', errorMessage);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: errorMessage.error.message
            }, {
                status: 500
            });
        }
        const data = await response.json();
        console.log('Datos recibidos:', data);
        const formattedData = data.data.map((entry)=>({
                dateStart: entry.date_start || 'N/A',
                dateStop: entry.date_stop || 'N/A',
                spend: parseFloat(entry.spend) || 0,
                impressions: parseInt(entry.impressions) || 0,
                reach: parseInt(entry.reach) || 0,
                clicks: parseInt(entry.clicks) || 0,
                uniqueClicks: parseInt(entry.unique_clicks) || 0,
                cpc: parseFloat(entry.cpc) || 0,
                ctr: parseFloat(entry.ctr) || 0,
                frequency: parseFloat(entry.frequency) || 0,
                campaignName: entry.campaign_name || 'N/A',
                adsetName: entry.adset_name || 'N/A',
                adName: entry.ad_name || 'N/A',
                effectiveStatus: entry.effective_status || 'N/A',
                actions: entry.actions ? entry.actions.map((action)=>({
                        actionType: action.action_type || 'N/A',
                        value: parseInt(action.value) || 0
                    })) : []
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            data: formattedData,
            paging: data.paging
        });
    } catch (error) {
        console.error('Error interno:', error.message || error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Error desconocido'
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__a759ccec._.js.map