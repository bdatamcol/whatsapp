import { webSearchTool, Agent, AgentInputItem, Runner } from "@openai/agents";
import { getConversation } from "./memory";

// --- SINGLETONS (no recrear en cada request) ---
const webSearchPreview = webSearchTool({
    filters: { allowed_domains: ["japolandiamotos.com"] },
    searchContextSize: "medium",
    userLocation: {
        city: "Cucuta",
        country: "CO",
        region: "Norte de Santander",
        type: "approximate",
    },
});

const japolandiaAgent = new Agent({
    name: "Asistente Japolandia",
    instructions: `Eres un asistente virtual especializado en atención al cliente para **Japolandia Motos** en Cúcuta, Colombia.
Profesional, cercano y útil. Usa emojis con moderación (🏍️, 💳, 🔧, 📞).
Ayuda al usuario a:
1) Explorar catálogo; 2) Precios/marcas (Victory, KYMCO, KTM, Ceronte);
3) Crédito/financiación (ORPA, mensual/quincenal); 4) Simulador de cuotas;
5) Mantenimiento; 6) Contacto por WhatsApp/redes.`,
    model: "gpt-4o",
    tools: [webSearchPreview],
    modelSettings: { reasoning: { effort: "low", summary: "auto" }, store: true },
});

const runner = new Runner({
    traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_68ee606da13481908a53c3c9758cb0eb00bef512e9f95f4e",
    },
});

// --- Helper: mapea tu historial de Supabase a AgentInputItem[] ---
function mapHistoryToAgentItems(
    history: Array<{ role: "user" | "assistant"; content: string }>
): AgentInputItem[] {
    return history.map((h) => {
        if (h.role === "user") {
            // Usuario -> input_text
            return {
                role: "user",
                content: [{ type: "input_text", text: h.content ?? "" }],
            } as AgentInputItem;
        }
        // Assistant -> output_text + status requerido
        return {
            role: "assistant",
            status: "completed",
            content: [{ type: "output_text", text: h.content ?? "" }],
        } as AgentInputItem;
    });
}

// --- API pública: lo que llama IAService ---
export async function askJapolandiaAgent(
    phone: string,
    message: string,
    company: { id: string }
): Promise<string> {
    // Trae historial guardado para dar contexto
    const past = await getConversation(phone, company.id); // [{role, content, ...}]
    const conversation: AgentInputItem[] = [
        ...mapHistoryToAgentItems(
            (past ?? []).filter(m => m.role === "user" || m.role === "assistant")
        ),
        { role: "user", content: [{ type: "input_text", text: message }] },
    ];

    const result = await runner.run(japolandiaAgent, conversation);

    if (!result.finalOutput) {
        throw new Error("El agente no devolvió salida final");
    }

    // Opcional: si quieres registrar herramientas/usos
    // console.log(result.newItems.map(i => i.rawItem));

    return result.finalOutput;
}
