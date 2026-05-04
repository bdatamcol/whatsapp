import OpenAI from "openai";
import { supabase } from "../../supabase/server.supabase";
import { getMotoPriceList, searchPrices, findExactPrice, type MotoPrice } from "./price-list-service";
import { calcularCuota } from "../utils/credit-calculator";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
});

export type IntentType =
    | "discover_moto"
    | "select_moto"
    | "simulate_credit"
    | "ask_price"
    | "greeting"
    | "human_request"
    | "out_of_scope"
    | "unknown";

export interface AuditEntry {
    phone: string;
    companyId: string;
    intent: IntentType;
    confidence: number;
    retrievedDocs: string[];
    responseText: string;
    toolCalls: string[];
    timestamp: string;
}

const SYSTEM_PROMPT = `Eres un asistente de ventas de motos de Japolandia Motos Cúcuta por WhatsApp. Tu objetivo es ayudar al cliente a encontrar la moto ideal y calcular cuotas de financiación.

MARCAS DISPONIBLES: TVS, VICTORY
LINEAS TVS: APACHE RTR 160, APACHE RTR 200, RAIDER 125, SPORT 100 ELS, STRYKER 125, RONIN 225 TD, NTORQ 125, NEO NX 110, DAZZ 110, IQUBE, MOTOCARRO KING DELUX
LINEAS VICTORY: MRX 125, MRX 150, COMBAT 100, BOMBER 125, NITRO 125, SWITCH 125, VENOM 14, VENOM 18, ADVANCE R 125, X1 FI 125, NEW LIFE 125, BET ABS

CATEGORIAS:
- Scooter: NTORQ, NEO NX, DAZZ, SPORT 100 ELS, SPORT 100 KLS, SPORT 100 CARGO (TVS), AGILITY FUSION, NEW LIFE, BET, X1 FI, ADVANCE R (Victory)
- Sport: APACHE RTR, RAIDER, RONIN, STRYKER
- Trabajo: COMBAT 100, BOMBER 125, NITRO 125, SWITCH 125, MOTOCARRO KING DELUX
- Enduro: MRX 125, MRX 150, VENOM 14, VENOM 18
- Electrica: IQUBE

REGLAS:
- NUNCA inventes precios ni nombres de motos
- NUNCA digas "no tengo" sin consultar primero la herramienta searchPrices
- Si searchPrices devuelve resultados, úsalos siempre
- Si searchPrices devuelve vacío, di "consulta el precio exacto con tu asesor"
- Los precios en los archivos están en formato número (sin puntos ni comas). Ej: 13999999 = $13.999.999
- Si el cliente pregunta por scooter, la categoría es "scooter"
- Si el cliente pregunta por "de trabajo" o "para trabajar", la categoría es "trabajo"

SALUDO: "¡Hola! Bienvenido a Japolandia Motos Cúcuta. ¿Qué tipo de moto te interesa? Puedo mostrarte opciones en Scooter, Sport, Trabajo, Enduro o Eléctrica."

RESPUESTAS: Máximo 2 oraciones. Sin asteriscos. Formato precio: $XX.XXX.XXX

FLUJO:
1. Cliente pide ver opciones (ej: "quiero sport", "qué tienes para scooter") → muestra TODAS las de esa categoría con precio
2. Cliente elige moto específica (ej: "la apache rtr 310", "me gusta la opción 2", "si quiero la 1") → confirma modelo + precio y pregunta meses
3. Cliente dice meses → llama calcularCuota(precio=X, meses=Y)
4. Cliente pide ver opciones sin categoría → muestra todas las motos disponibles

REGLAS DE CONTEXTO:
- Cuando el cliente ya eligió una moto ("me interesa la apache", "si quiero la 1"), NO vuelvas a mostrar la lista completa
- Solo confirma el modelo, muestra el precio y pregunta: "¿A cuántos meses quieres financiar?"
- Si el cliente dice "sí" a una moto que ya se mostró, confirma y pasa a preguntar meses`;

function detectIntent(text: string): { intent: IntentType; category?: string; brand?: string; explicitMoto?: string } {
    const q = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (/hola|buenos|buenas|saludos|qué tal/.test(q)) {
        return { intent: "greeting" };
    }
    if (/asesor|humano|dormido|colgado/.test(q)) {
        return { intent: "human_request" };
    }
    if (/cuánto queda|cuota|meses|a \d+ meses|financiar|financiación/.test(q) && /\d/.test(q)) {
        return { intent: "simulate_credit" };
    }
    if (/cuánto cuesta|precio|cual es el precio/.test(q)) {
        return { intent: "ask_price" };
    }

    const scooterWords = /scooter|electrica|x1 fi|ntorq|neo nx|dazz|sport 100|new life|agility|bet|advance/i;
    const trabajoWords = /trabajo|trabajar|bomber|combat|nitro|switch|motocarro|king/i;
    const sportWords = /sport|deportiva/i;
    const enduroWords = /enduro/i;

    if (scooterWords.test(q)) return { intent: "discover_moto", category: "scooter" };
    if (trabajoWords.test(q)) return { intent: "discover_moto", category: "trabajo" };
    if (sportWords.test(q)) return { intent: "discover_moto", category: "sport" };
    if (enduroWords.test(q)) return { intent: "discover_moto", category: "enduro" };

    if (/tvs|victory|kymco|ceronte/i.test(q) && !/moto.*tvs|tvs.*moto/i.test(q)) {
        const brand = /tvs/i.test(q) ? "TVS" : /victory/i.test(q) ? "VICTORY" : undefined;
        return { intent: brand ? "discover_moto" : "select_moto", brand };
    }

    if (/moto.*tvs|tvs.*moto|apache|raider|stryker|ronin|ntorq|combat|mrx|venom|bomber|nitro|switch|x1|advance|neo|dazz|iqube/i.test(q)) {
        const match = q.match(/(?:apache|raider|stryker|ronin|ntorq|combat|mrx|venom|bomber|nitro|switch|x1|advance|neo|dazz|iqube)[^\d]*(\d+)?/i);
        return { intent: "select_moto", explicitMoto: match ? match[0].trim() : text.slice(0, 40) };
    }

    if (/ver opciones|ver motos|mostrar|qué tienes|dame|muestrame|ver más|ver todas|mas opciones/i.test(q)) {
        return { intent: "discover_moto" };
    }

    if (/me gusta|me interesa|quiero la|elijo|prefiero la|la opción|la numero|opcion \d|numero \d/i.test(q)) {
        return { intent: "select_moto" };
    }

    return { intent: "unknown" };
}

async function getRecentMessages(phone: string, companyId: string): Promise<string> {
    const { data } = await supabase
        .from("conversations")
        .select("messages")
        .eq("phone", phone)
        .eq("company_id", companyId)
        .maybeSingle();

    const msgs: string[] = [];
    const all = data?.messages ?? [];
    const recent = all.slice(-6);
    for (const m of recent) {
        if (m.role === "user" || m.role === "assistant") {
            msgs.push(`[${m.role}]: ${m.content}`);
        }
    }
    return msgs.join("\n");
}

const TOOLS = [
    {
        type: "function" as const,
        name: "searchPrices",
        description:
            "Busca motos en el catálogo oficial. Parámetros: query (texto libre: categoría, marca o nombre), category (scooter/trabajo/sport/enduro), brand (TVS/VICTORY). Debe usarse SIEMPRE cuando el cliente pida ver opciones, listar motos, o pregunte por scooter/trabajo/sport/enduro.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Texto de búsqueda: scooter, trabajo, tvs, victory, apache, mrx, etc." },
                category: { type: "string", description: "Categoría: scooter, trabajo, sport, enduro. Usar este si el cliente pide explícitamente una categoría." },
                brand: { type: "string", description: "Marca: TVS o VICTORY" },
                limit: { type: "number", description: "Máximo resultados (default 8)" },
            },
            required: ["query"],
        },
    },
    {
        type: "function" as const,
        name: "calcularCuota",
        description: "Calcula cuota mensual. Usar cuando el cliente indique precio y meses.",
        parameters: {
            type: "object",
            properties: {
                precio: { type: "number", description: "Precio en pesos colombianos (número, sin puntos). Ej: 9649999" },
                meses: { type: "number", description: "Número de meses. Ej: 12, 24, 48" },
            },
            required: ["precio", "meses"],
        },
    },
] as const;

type ToolName = "searchPrices" | "calcularCuota";

function parseMonths(text: string): number | null {
    const match = text.match(/\b(\d+)\s*(?:meses?|mes)\b/i);
    return match ? Number(match[1]) : null;
}

function parsePrice(text: string): number | null {
    const cleaned = text.replace(/[^\d]/g, "");
    const num = Number(cleaned);
    if (num >= 100000 && num <= 100000000) return num;
    return null;
}

async function executeTool(name: ToolName, args: Record<string, unknown>): Promise<string> {
    switch (name) {
        case "searchPrices": {
            const query = String(args.query || "");
            const category = args.category as string | undefined;
            const brand = args.brand as string | undefined;
            const limit = Number(args.limit) || 20;
            const results = await searchPrices(query, { category: category as any, brand, limit });
            if (!results.length) {
                return "SIN_RESULTADOS";
            }
            return results
                .slice(0, limit)
                .map((p) => {
                    if (p.precioBase > 0) {
                        const price = `$${p.precioBase.toLocaleString("es-CO")}`;
                        const bono = p.bonoDescuento && p.bonoDescuento > 0 ? ` (bono $${p.bonoDescuento.toLocaleString("es-CO")})` : "";
                        return `${p.referencia} - ${price}${bono}`;
                    }
                    return `${p.referencia} - precio consultar`;
                })
                .join("\n");
        }
        case "calcularCuota": {
            const precio = Number(args.precio);
            const meses = Number(args.meses);
            if (!precio || !meses || precio <= 0 || meses <= 0) {
                return "ERROR: precio o meses inválidos";
            }
            const cuota = calcularCuota(precio, meses);
            return `CUOTA:${cuota}|PRECIO:${precio}|MESES:${meses}`;
        }
        default:
            return "ERROR: función desconocida";
    }
}

async function callWithTools(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    detectedIntent: ReturnType<typeof detectIntent>
): Promise<{ text: string; toolsCalled: string[] }> {
    const toolsCalled: string[] = [];
    let text = "";

    const autoQuery = (() => {
        if (detectedIntent.intent === "discover_moto" && detectedIntent.category) {
            return { query: detectedIntent.category, category: detectedIntent.category, brand: undefined };
        }
        if (detectedIntent.intent === "discover_moto" && detectedIntent.brand) {
            return { query: detectedIntent.brand, category: undefined, brand: detectedIntent.brand };
        }
        if (detectedIntent.intent === "discover_moto") {
            return { query: "", category: undefined, brand: undefined };
        }
        if (detectedIntent.intent === "select_moto" && detectedIntent.explicitMoto) {
            return { query: detectedIntent.explicitMoto, category: undefined, brand: undefined };
        }
        return null;
    })();

    const initialMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
    ];

    if (autoQuery) {
        let autoResults = await executeTool("searchPrices", autoQuery as Record<string, unknown>);
        toolsCalled.push("searchPrices");

        if (autoResults === "SIN_RESULTADOS" && (autoQuery.category || autoQuery.brand)) {
            const fallbackQuery = autoQuery.category || autoQuery.brand || "";
            autoResults = await executeTool("searchPrices", { query: fallbackQuery, limit: 30 });
            toolsCalled.push("searchPrices+FALLBACK");
        }

        const isExplicitSelect = detectedIntent.intent === "select_moto" && detectedIntent.explicitMoto;
        const isDiscover = detectedIntent.intent === "discover_moto";
        const label = autoQuery?.category || autoQuery?.brand || (isExplicitSelect ? detectedIntent.explicitMoto : "disponibles");

        initialMessages.push({
            role: "user",
            content: isDiscover
                ? `[MOTOS ${label.toUpperCase()} DISPONIBLES]:\n${autoResults}\n\nResponde con la lista de motos disponibles.`
                : `[RESULTADO MOTO ESPECÍFICA: ${label.toUpperCase()}]:\n${autoResults}\n\nResponde indicando el precio y confirmando si es la moto que el cliente busca. Si es la correcta, pregunta cuántos meses quiere financiar.`,
        });
    }

    const response = await openai.responses.create({
        model: "gpt-4.1-2025-04-14",
        input: initialMessages,
        tools: TOOLS as unknown as OpenAI.ResponseTool[],
    });

    const toolResults: Array<{ type: "function_call_output"; call_id: string; output: string }> = [];

    for (const output of response.output) {
        if (output.type === "message") {
            const content = (output as any).content;
            if (Array.isArray(content)) {
                text = content.map((c: any) => c.text).join("");
            }
        } else if (output.type === "function_call") {
            const fn = output as any;
            const name = fn.name as ToolName;
            const fnArgs = typeof fn.arguments === "string" ? JSON.parse(fn.arguments) : fn.arguments || {};
            const result = await executeTool(name, fnArgs);
            toolsCalled.push(name);
            toolResults.push({ type: "function_call_output", call_id: fn.call_id, output: result });
        }
    }

    if (toolResults.length > 0) {
        const lastUserMsg = messages[messages.length - 1]?.content || "";

        let finalText = text;
        for (const tr of toolResults) {
            if (tr.output === "SIN_RESULTADOS") {
                finalText = "No encontré motos con esa búsqueda en el catálogo. ¿Quieres probar otra categoría o consultar con tu asesor?";
            } else if (tr.output.startsWith("ERROR:")) {
                finalText = tr.output.replace("ERROR: ", "");
            } else if (tr.output.startsWith("CUOTA:")) {
                const parts = tr.output.split("|");
                const cuota = Number(parts[0].split(":")[1]);
                const precio = Number(parts[1].split(":")[1]);
                const meses = Number(parts[2].split(":")[1]);
                finalText = `La cuota aprox es $${cuota.toLocaleString("es-CO")} mensuales para $${precio.toLocaleString("es-CO")} a ${meses} meses. ¿Te muestro otra opción de meses?`;
            } else if (toolsCalled.includes("searchPrices") && finalText.length < 20) {
                finalText = `${tr.output}\n\n¿Cuál te gusta?`;
            }
        }

        return { text: finalText, toolsCalled };
    }

    return { text: text || "Estoy teniendo dificultades. ¿Puedes intentar de nuevo?", toolsCalled };
}

export async function askWithResponsesAPI(
    phone: string,
    companyId: string,
    userMessage: string
): Promise<{ response: string; audit: AuditEntry }> {
    const detected = detectIntent(userMessage);
    const history = await getRecentMessages(phone, companyId);

    const intentResult: AuditEntry = {
        phone,
        companyId,
        intent: detected.intent,
        confidence: 0.8,
        retrievedDocs: [],
        responseText: "",
        toolCalls: [],
        timestamp: new Date().toISOString(),
    };

    let text = "";
    try {
        if (detected.intent === "greeting") {
            return {
                response: "¡Hola! Bienvenido a Japolandia Motos Cúcuta. ¿Qué tipo de moto te interesa? Puedo mostrarte opciones en Scooter, Sport, Trabajo, Enduro o Eléctrica.",
                audit: { ...intentResult, responseText: "¡Hola! Bienvenido a Japolandia Motos Cúcuta." },
            };
        }

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: "user",
                content: `${history ? `Historial:\n${history}\n\n` : ""}Cliente: ${userMessage}`,
            },
        ];

        const result = await callWithTools(messages, detected);
        text = result.text;
        intentResult.toolCalls = result.toolsCalled;
    } catch (e: any) {
        console.error("[ResponsesAPI] Error:", e?.message);
        text = "Estoy teniendo dificultades técnicas. Por favor intenta de nuevo en un momento.";
    }

    intentResult.responseText = text;
    return { response: text, audit: intentResult };
}

export async function saveAuditEntry(entry: AuditEntry): Promise<void> {
    await supabase.from("ia_audit_log").insert({
        phone: entry.phone,
        company_id: entry.companyId,
        intent: entry.intent,
        confidence: entry.confidence,
        retrieved_sources: entry.retrievedDocs,
        response_text: entry.responseText,
        tool_calls: entry.toolCalls,
        created_at: entry.timestamp,
    });
}
