import OpenAI from "openai";
import { supabase } from "../supabase/server.supabase";
import { getConversation, updateConversation } from "./memory";
import { calcularCuota, formatearPesos } from "./utils/credit-calculator";
import { isUsableCustomerName, sanitizeCustomerName } from "../utils/nameQuality";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
});

const FINANCE_TERMS = [
    "credito",
    "crédito",
    "financiar",
    "financiacion",
    "financiación",
    "cuota",
    "cuotas",
    "plazo",
    "mes",
    "meses",
    "millon",
    "millones",
    "pesos",
];

const GREETINGS = [
    "hola",
    "buenas",
    "buenos dias",
    "buenas tardes",
    "buenas noches",
    "hey",
    "que mas",
    "qué más",
];

const START_FINANCING_TERMS = [
    "iniciar",
    "iniciar financiacion",
    "iniciar financiación",
    "como inicio",
    "como empezar",
    "que debo hacer",
    "que sigue",
    "siguiente paso",
    "tramite",
    "trámite",
    "proceso",
    "aplicar",
    "solicitar",
];

const PRODUCT_DISCOVERY_TERMS = [
    "busco moto",
    "buscando moto",
    "moto nueva",
    "quiero una moto",
    "quiero moto",
    "que motos tienen",
    "qué motos tienen",
    "que moto me recomiendas",
    "qué moto me recomiendas",
    "me recomiendas una moto",
    "me recomedar una moto",
    "recomendar una moto",
    "recomiendes una moto",
    "modelos",
    "catalogo",
    "catálogo",
    "moto para trabajar",
    "moto para diario",
    "moto sport",
    "moto deportiva",
];

const SIMULATION_CONTINUATION_TERMS = [
    "como seria",
    "cómo sería",
    "cuanto quedaria",
    "cuánto quedaría",
    "cuanto seria",
    "cuánto sería",
    "la misma",
    "ese valor",
    "esa moto",
];

const ALLOWED_TERMS = new Set([6, 12, 18, 24, 36, 48]);

const SYSTEM_PROMPT = `Eres JapolandiaMovil, asistente de financiamiento de motocicletas.

REGLAS OBLIGATORIAS:
1) Solo atiendes consultas de créditos/financiación de motos.
2) Si el usuario pregunta algo fuera de ese alcance, responde breve y claro que no tienes conocimiento de ese tema y redirígelo a financiación.
3) Nunca digas frases sobre "documentos", "archivos subidos", "herramientas", "prompts" ni procesos internos.
4) Si ya tienes el nombre del cliente, no lo vuelvas a pedir.
5) Si ya tienes precio y plazo, calcula sin repreguntar.
6) Si falta información, pregunta solo el dato faltante.
7) Usa tono amable, profesional y breve.

CÁLCULO:
- Para calcular cuotas usa SIEMPRE la función calcular_cuota.
- Plazos válidos: 6, 12, 18, 24, 36, 48 meses.
`;

const ASSISTANT_TOOLS: OpenAI.Beta.Assistants.AssistantTool[] = [
    {
        type: "function",
        function: {
            name: "calcular_cuota",
            description: "Calcula la cuota mensual de financiación de una moto.",
            parameters: {
                type: "object",
                properties: {
                    precio_producto: {
                        type: "number",
                        description: "Precio total en pesos colombianos.",
                    },
                    plazo_meses: {
                        type: "integer",
                        description: "Plazo en meses (6, 12, 18, 24, 36, 48).",
                    },
                    cuota_inicial: {
                        type: "number",
                        description: "Cuota inicial en pesos. Si no existe, usar 0.",
                    },
                },
                required: ["precio_producto", "plazo_meses"],
            },
        },
    },
];

type ConversationMessage = {
    role?: string;
    content?: string;
};

type MemorySlots = {
    name?: string;
    totalPrice?: number;
    financeAmount?: number;
    termMonths?: number;
};

type NameDetection = {
    name?: string;
    confidence: "none" | "medium" | "high";
};

let cachedAssistantId: string | null = null;

function normalizeText(input: string): string {
    return (input || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function hasAnyTerm(text: string, terms: string[]): boolean {
    const normalized = normalizeText(text);
    return terms.some((term) => normalized.includes(normalizeText(term)));
}

function detectName(text: string): NameDetection {
    const cleaned = normalizeText(text);

    const highConfidencePatterns = [
        /(?:mi nombre es|me llamo)\s+([a-z\s]{2,40})/i,
    ];

    for (const pattern of highConfidencePatterns) {
        const match = cleaned.match(pattern);
        if (match?.[1]) {
            const candidate = match[1].trim().split(" ").slice(0, 2).join(" ");
            const normalized = sanitizeCustomerName(candidate);
            if (!normalized || !isUsableCustomerName(normalized)) {
                return { confidence: "none" };
            }
            return { name: normalized, confidence: "high" };
        }
    }

    const mediumConfidenceMatch = cleaned.match(/(?:^|\s)soy\s+([a-z\s]{2,40})/i);
    if (mediumConfidenceMatch?.[1]) {
        const candidate = mediumConfidenceMatch[1].trim().split(" ").slice(0, 2).join(" ");
        const normalized = sanitizeCustomerName(candidate);
        if (!normalized || !isUsableCustomerName(normalized)) {
            return { confidence: "none" };
        }
        return { name: normalized, confidence: "medium" };
    }

    return { confidence: "none" };
}

function extractName(text: string): string | undefined {
    return detectName(text).name;
}

function parseMoneyValue(rawNumber: string, isMillions: boolean): number | null {
    const normalized = rawNumber.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
    const parsed = Number(normalized);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    if (isMillions) return Math.round(parsed * 1_000_000);
    return Math.round(parsed);
}

function extractTermMonths(text: string): number | undefined {
    const normalized = normalizeText(text);
    const match = normalized.match(/(\d{1,2})\s*mes(?:es)?/i);
    if (!match?.[1]) return undefined;
    const term = Number(match[1]);
    if (!ALLOWED_TERMS.has(term)) return undefined;
    return term;
}

function extractMoneyMentions(text: string): Array<{ value: number; index: number }> {
    const mentions: Array<{ value: number; index: number }> = [];
    const normalized = normalizeText(text);

    const regex = /(\d+(?:[\.,]\d+)?)\s*(millon(?:es)?|mil)?/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalized)) !== null) {
        const numRaw = match[1];
        const unit = match[2] || "";
        const isMillions = unit.startsWith("millon");

        if (!numRaw) continue;

        const value = parseMoneyValue(numRaw, isMillions);
        if (!value) continue;

        if (!isMillions && value < 100000) {
            continue;
        }

        mentions.push({ value, index: match.index });
    }

    return mentions;
}

function mergeSlotsFromMessage(message: string, current: MemorySlots, isLatestMessage = false): MemorySlots {
    const next = { ...current };
    const normalized = normalizeText(message);

    const maybeName = extractName(message);
    if (maybeName) next.name = maybeName;

    const termMonths = extractTermMonths(message);
    if (termMonths) next.termMonths = termMonths;

    const mentions = extractMoneyMentions(message);
    let latestFinanceValue: number | undefined;
    let hasExplicitTotalPrice = false;

    if (mentions.length > 0) {
        const financingMatch = normalized.match(/(?:financiar|credito|credito para|financiacion de|financiacion|prestar)\s+(\d+(?:[\.,]\d+)?)\s*(millon(?:es)?|mil)?/i);
        if (financingMatch?.[1]) {
            const value = parseMoneyValue(financingMatch[1], (financingMatch[2] || "").startsWith("millon"));
            if (value) {
                next.financeAmount = value;
                latestFinanceValue = value;
            }
        }

        const totalMatch = normalized.match(/(?:moto de|vale|cuesta|precio de|precio)\s+(\d+(?:[\.,]\d+)?)\s*(millon(?:es)?|mil)?/i);
        if (totalMatch?.[1]) {
            const value = parseMoneyValue(totalMatch[1], (totalMatch[2] || "").startsWith("millon"));
            if (value) {
                next.totalPrice = value;
                hasExplicitTotalPrice = true;
            }
        }

        if (!next.totalPrice && mentions[0]) {
            next.totalPrice = mentions[0].value;
        }
    }

    if (isLatestMessage && latestFinanceValue && !hasExplicitTotalPrice) {
        next.totalPrice = latestFinanceValue;
    }

    if (!next.totalPrice && next.financeAmount) {
        next.totalPrice = next.financeAmount;
    }

    if (next.totalPrice && next.financeAmount && next.financeAmount > next.totalPrice) {
        next.financeAmount = undefined;
    }

    return next;
}

function inferSlotsFromHistory(history: ConversationMessage[], latestMessage: string): MemorySlots {
    const userMessages = history
        .filter((m) => m.role === "user" && typeof m.content === "string")
        .slice(-12)
        .map((m) => m.content as string);

    let slots: MemorySlots = {};

    for (const msg of userMessages) {
        slots = mergeSlotsFromMessage(msg, slots, false);
    }

    slots = mergeSlotsFromMessage(latestMessage, slots, true);

    return slots;
}

function financeContextDetected(message: string, history: ConversationMessage[]): boolean {
    if (isGreetingOnly(message)) return false;
    if (hasAnyTerm(message, FINANCE_TERMS)) return true;

    const hasNumericSignal = extractTermMonths(message) !== undefined || extractMoneyMentions(message).length > 0;
    if (!hasNumericSignal) return false;

    const recentUserText = history
        .filter((m) => m.role === "user")
        .slice(-4)
        .map((m) => m.content || "")
        .join(" ");

    return hasAnyTerm(recentUserText, FINANCE_TERMS);
}

function isGreetingOnly(message: string): boolean {
    const normalized = normalizeText(message);
    if (!normalized) return false;
    if (!hasAnyTerm(normalized, GREETINGS)) return false;

    return normalized.split(" ").length <= 4;
}

function isStartFinancingIntent(message: string): boolean {
    return hasAnyTerm(message, START_FINANCING_TERMS);
}

function isProductDiscoveryIntent(message: string): boolean {
    return hasAnyTerm(message, PRODUCT_DISCOVERY_TERMS);
}

function productContextDetected(message: string, history: ConversationMessage[]): boolean {
    if (isProductDiscoveryIntent(message)) return true;

    const normalized = normalizeText(message);
    const hasMotoWord = normalized.includes("moto") || normalized.includes("motos");
    const hasRecommendationWord = normalized.includes("recom") || normalized.includes("sugier");

    if (hasMotoWord && !hasFreshSimulationSignal(message)) {
        return true;
    }

    const recentUserText = history
        .filter((m) => m.role === "user")
        .slice(-4)
        .map((m) => m.content || "")
        .join(" ");

    if (hasAnyTerm(recentUserText, PRODUCT_DISCOVERY_TERMS) && hasRecommendationWord && !hasFreshSimulationSignal(message)) {
        return true;
    }

    return false;
}

function hasRecommendationIntent(message: string): boolean {
    const normalized = normalizeText(message);
    return (
        normalized.includes("recom") ||
        normalized.includes("sugier") ||
        normalized.includes("o no") ||
        normalized.includes("si o no") ||
        normalized.includes("sí o no")
    );
}

function lastAssistantWasCatalogRedirect(history: ConversationMessage[]): boolean {
    const lastAssistant = [...history].reverse().find((m) => m.role === "assistant" && typeof m.content === "string");
    if (!lastAssistant?.content) return false;

    const normalized = normalizeText(lastAssistant.content);
    return normalized.includes("japolandiamotos.com") || normalized.includes("linea sport");
}

function hasFreshSimulationSignal(message: string): boolean {
    return extractTermMonths(message) !== undefined || extractMoneyMentions(message).length > 0;
}

function buildFinanceResponse(slots: MemorySlots): string {
    const totalPrice = slots.totalPrice as number;
    const termMonths = slots.termMonths as number;
    const financeAmount = slots.financeAmount;
    const initialPayment = financeAmount ? Math.max(0, totalPrice - financeAmount) : 0;

    const monthly = calcularCuota(totalPrice, termMonths, initialPayment);
    const totalText = formatearPesos(totalPrice);
    const financeText = financeAmount ? formatearPesos(financeAmount) : totalText;

    return `Perfecto${slots.name ? `, ${slots.name}` : ""}. Para un valor de ${totalText} financiando ${financeText} a ${termMonths} meses, la cuota mensual aproximada es ${formatearPesos(monthly)}. Si quieres, te muestro tambien opcion a 12 y 24 meses para comparar.`;
}

function buildMissingDataPrompt(slots: MemorySlots): string {
    if (!slots.totalPrice) {
        return "Claro, te ayudo con eso. Para calcular la cuota necesito el valor de la moto en pesos. Ejemplo: 10 millones.";
    }

    if (!slots.termMonths) {
        return "Perfecto. Ahora dime el plazo en meses (6, 12, 18, 24, 36 o 48) para calcular tu cuota.";
    }

    return "Listo, necesito un dato adicional para continuar con el calculo.";
}

function buildOutOfScopeResponse(): string {
    return "En este momento te puedo ayudar con informacion general de motos Japolandia y simulaciones de credito para motocicletas. Si quieres, te guio con eso: dime que tipo de moto buscas o el valor y plazo para calcular tu cuota.";
}

function buildStartProcessResponse(name?: string): string {
    const greeting = name ? `Perfecto, ${name}.` : "Perfecto.";
    return `${greeting} Para iniciar con la financiacion te voy a comunicar con un asesor humano. Escribe por favor: *Necesito un asesor* y continuamos con el proceso.`;
}

function buildNoCatalogResponse(name?: string): string {
    const greeting = name ? `Claro, ${name}.` : "Claro.";
    return `${greeting} En Japolandia Motos tenemos referencias para tu dia a dia, trabajo y linea sport. Puedes ver los modelos disponibles aqui: https://japolandiamotos.com/ . Si quieres, te ayudo de una vez con la simulacion de credito: dime valor de la moto y plazo (6, 12, 18, 24, 36 o 48 meses).`;
}

function buildGuidedRecommendationResponse(name?: string): string {
    const intro = name
        ? `${name}, claro que si te puedo orientar.`
        : "Claro que si te puedo orientar.";

    return `${intro} Para recomendarte bien una moto necesito 2 datos: 1) uso principal (trabajo, dia a dia o sport) y 2) presupuesto aproximado. Con eso te doy una recomendacion puntual y luego validamos modelos disponibles en https://japolandiamotos.com/ .`;
}

function buildGreetingResponse(name: string | undefined, hasPreviousConversation: boolean): string {
    if (name) {
        if (hasPreviousConversation) {
            return `Hola de nuevo, ${name}. Que gusto tenerte por aqui. Estoy listo para ayudarte con tu financiacion de moto. Si quieres, dime valor y plazo en meses para simular la cuota.`;
        }

        return `Hola, ${name}. Mucho gusto. Estoy listo para ayudarte con financiacion de motos. Si quieres, dime valor y plazo en meses para simular tu cuota.`;
    }

    if (hasPreviousConversation) {
        return "Hola, bienvenido de nuevo. Para atenderte mejor, me confirmas tu nombre por favor? Con eso seguimos con tu simulacion de financiacion.";
    }

    return "Hola, bienvenido. Soy tu asistente de financiacion de motos. Para atenderte mejor, me compartes tu nombre por favor?";
}

export class CreditBotService {
    private static async getContactName(phone: string, companyId: string): Promise<string | undefined> {
        const { data } = await supabase
            .from("contacts")
            .select("name")
            .eq("phone", phone)
            .eq("company_id", companyId)
            .maybeSingle();

        const rawName = (data?.name || "").trim();
        const cleanName = sanitizeCustomerName(rawName);
        if (!cleanName || !isUsableCustomerName(cleanName)) return undefined;
        return cleanName;
    }

    private static async updateContactName(phone: string, companyId: string, name: string): Promise<void> {
        const cleanName = sanitizeCustomerName(name);
        if (!cleanName || !isUsableCustomerName(cleanName)) {
            return;
        }

        await supabase
            .from("contacts")
            .update({
                name: cleanName,
                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`,
                last_interaction_at: new Date().toISOString(),
            })
            .eq("phone", phone)
            .eq("company_id", companyId);
    }

    private static async getOrCreateAssistant(): Promise<string> {
        if (cachedAssistantId) {
            return cachedAssistantId;
        }

        if (process.env.OPENAI_ASSISTANT_ID) {
            cachedAssistantId = process.env.OPENAI_ASSISTANT_ID;

            try {
                await openai.beta.assistants.update(cachedAssistantId, {
                    instructions: SYSTEM_PROMPT,
                    model: "gpt-4o",
                    tools: ASSISTANT_TOOLS,
                    temperature: 0.2,
                });
            } catch (error) {
                console.warn("No se pudo actualizar el assistant por env:", error);
            }

            return cachedAssistantId;
        }

        try {
            const assistants = await openai.beta.assistants.list({ limit: 100 });
            const existing = assistants.data.find((a) => a.name === "JapolandiaMovil - Bot de Creditos");

            if (existing) {
                cachedAssistantId = existing.id;
                await openai.beta.assistants.update(cachedAssistantId, {
                    instructions: SYSTEM_PROMPT,
                    model: "gpt-4o",
                    tools: ASSISTANT_TOOLS,
                    temperature: 0.2,
                });
                return cachedAssistantId;
            }
        } catch (error) {
            console.warn("Error listando assistants:", error);
        }

        const assistant = await openai.beta.assistants.create({
            name: "JapolandiaMovil - Bot de Creditos",
            instructions: SYSTEM_PROMPT,
            model: "gpt-4o",
            tools: ASSISTANT_TOOLS,
            temperature: 0.2,
        });

        cachedAssistantId = assistant.id;
        return cachedAssistantId;
    }

    private static async getOrCreateThread(phone: string, companyId: string): Promise<string> {
        const { data } = await supabase
            .from("conversations")
            .select("thread_id")
            .eq("phone", phone)
            .eq("company_id", companyId)
            .maybeSingle();

        let threadId = data?.thread_id;

        if (!threadId) {
            const thread = await openai.beta.threads.create();
            threadId = thread.id;

            await supabase
                .from("conversations")
                .upsert(
                    {
                        phone,
                        company_id: companyId,
                        thread_id: threadId,
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "phone,company_id",
                    }
                );
        }

        return threadId;
    }

    private static async saveTurn(
        phone: string,
        company: { id: string },
        history: ConversationMessage[],
        userMessage: string,
        assistantMessage: string,
        threadId?: string
    ): Promise<void> {
        const finalHistory = [
            ...history,
            {
                id: `user-${Date.now()}`,
                role: "user",
                content: userMessage,
                timestamp: new Date().toISOString(),
            },
            {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: assistantMessage,
                timestamp: new Date().toISOString(),
                status: "sent",
            },
        ];

        await updateConversation(phone, finalHistory, company, threadId);
    }

    private static async handleFunctionCall(functionName: string, args: any): Promise<string> {
        if (functionName !== "calcular_cuota") {
            return JSON.stringify({ error: `Funcion desconocida: ${functionName}` });
        }

        const precio = Number(args?.precio_producto);
        const plazo = Number(args?.plazo_meses);
        const inicial = args?.cuota_inicial ? Number(args.cuota_inicial) : 0;

        if (Number.isNaN(precio) || Number.isNaN(plazo) || Number.isNaN(inicial)) {
            return JSON.stringify({ error: "Parametros invalidos" });
        }

        const cuota = calcularCuota(precio, plazo, inicial);
        return JSON.stringify({
            cuota_mensual: cuota,
            cuota_formateada: formatearPesos(cuota),
            precio_producto: precio,
            plazo_meses: plazo,
            cuota_inicial: inicial,
        });
    }

    private static async cancelActiveRuns(threadId: string): Promise<void> {
        try {
            const runs = await openai.beta.threads.runs.list(threadId, { limit: 5 });
            for (const run of runs.data) {
                if (["queued", "in_progress", "requires_action"].includes(run.status)) {
                    // @ts-ignore sdk overloads
                    await openai.beta.threads.runs.cancel(threadId, run.id);
                    await new Promise((resolve) => setTimeout(resolve, 250));
                }
            }
        } catch (error: any) {
            console.warn("No se pudieron cancelar runs activos:", error?.message || error);
        }
    }

    private static async runAssistant(
        threadId: string,
        assistantId: string,
        userMessage: string
    ): Promise<string> {
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: userMessage,
        });

        let run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: assistantId,
        });

        for (let i = 0; i < 30; i++) {
            if (run.status === "requires_action") {
                const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];
                const toolOutputs = await Promise.all(
                    toolCalls.map(async (call: any) => {
                        const output = await this.handleFunctionCall(
                            call.function?.name,
                            JSON.parse(call.function?.arguments || "{}")
                        );
                        return { tool_call_id: call.id, output };
                    })
                );

                run = await openai.beta.threads.runs.submitToolOutputs(run.id, {
                    thread_id: threadId,
                    tool_outputs: toolOutputs,
                });
            } else if (run.status === "queued" || run.status === "in_progress") {
                await new Promise((resolve) => setTimeout(resolve, 700));
                run = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
            } else {
                break;
            }
        }

        if (run.status !== "completed") {
            throw new Error(`Run incompleto: ${run.status}`);
        }

        const messages = await openai.beta.threads.messages.list(threadId, { order: "desc", limit: 10 });
        const assistantMessage = messages.data.find((m: any) => m.role === "assistant");
        const textPart = assistantMessage?.content?.find((p: any) => p?.type === "text") as any;
        const responseText = textPart?.text?.value as string | undefined;

        if (!responseText) {
            throw new Error("No hubo respuesta de texto del assistant");
        }

        return responseText;
    }

    public static async askCreditBot(
        phone: string,
        message: string,
        company: { id: string }
    ): Promise<string> {
        const history = (await getConversation(phone, company.id)) as ConversationMessage[];
        const nameDetection = detectName(message);
        const slots = inferSlotsFromHistory(history, message);
        const storedContactName = await this.getContactName(phone, company.id);

        if (!slots.name && storedContactName) {
            slots.name = storedContactName;
        }

        if (nameDetection.name && nameDetection.confidence === "high" && nameDetection.name !== storedContactName) {
            await this.updateContactName(phone, company.id, nameDetection.name);
            slots.name = nameDetection.name;
        }

        const isFinanceContext = financeContextDetected(message, history);
        const hasPreviousConversation = history.some((m) => m.role === "user" || m.role === "assistant");
        const freshSimulationSignal = hasFreshSimulationSignal(message);
        const continuationSignal = hasAnyTerm(message, SIMULATION_CONTINUATION_TERMS);
        const isProductContext = productContextDetected(message, history);
        const recommendationIntent = hasRecommendationIntent(message);
        const repeatedCatalogRedirect = lastAssistantWasCatalogRedirect(history);

        if (isGreetingOnly(message)) {
            const greeting = buildGreetingResponse(slots.name, hasPreviousConversation);
            await this.saveTurn(phone, company, history, message, greeting);
            return greeting;
        }

        if (isStartFinancingIntent(message)) {
            const startResponse = buildStartProcessResponse(slots.name);
            await this.saveTurn(phone, company, history, message, startResponse);
            return startResponse;
        }

        if (isProductContext && !freshSimulationSignal) {
            const response = (recommendationIntent || repeatedCatalogRedirect)
                ? buildGuidedRecommendationResponse(slots.name)
                : buildNoCatalogResponse(slots.name);
            await this.saveTurn(phone, company, history, message, response);
            return response;
        }

        if (!isFinanceContext && !isGreetingOnly(message)) {
            const out = buildOutOfScopeResponse();
            await this.saveTurn(phone, company, history, message, out);
            return out;
        }

        if (isFinanceContext) {
            if (slots.totalPrice && slots.termMonths && (freshSimulationSignal || continuationSignal)) {
                try {
                    const response = buildFinanceResponse(slots);
                    await this.saveTurn(phone, company, history, message, response);
                    return response;
                } catch (error) {
                    const fallback = "Tuve un problema al calcular la cuota. Intenta de nuevo con valor de la moto y plazo en meses.";
                    await this.saveTurn(phone, company, history, message, fallback);
                    return fallback;
                }
            }

            const missing = buildMissingDataPrompt(slots);
            await this.saveTurn(phone, company, history, message, missing);
            return missing;
        }

        try {
            const assistantId = await this.getOrCreateAssistant();
            const threadId = await this.getOrCreateThread(phone, company.id);
            await this.cancelActiveRuns(threadId);

            const contextName = slots.name ? `Cliente: ${slots.name}. ` : "";
            const enrichedInput = `${contextName}Mensaje actual del cliente: ${message}`;

            const answer = await this.runAssistant(threadId, assistantId, enrichedInput);
            await this.saveTurn(phone, company, history, message, answer, threadId);
            return answer;
        } catch (error) {
            const fallback = "Lo siento, estoy teniendo dificultades tecnicas. Si quieres, te ayudo con una simulacion: valor de la moto y plazo en meses.";
            await this.saveTurn(phone, company, history, message, fallback);
            return fallback;
        }
    }
}
