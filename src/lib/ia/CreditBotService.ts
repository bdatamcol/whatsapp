import OpenAI from "openai";
import { supabase } from '../supabase/server.supabase';
import { getConversation, updateConversation } from "./memory";
import { calcularCuota, formatearPesos } from "./utils/credit-calculator";
import { searchProducts, getRandomProducts, formatProducts } from "./utils/catalog-service";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
});

// System prompt para el bot
const SYSTEM_PROMPT = `Eres JapolandiaMovil, un asistente experto en créditos y motocicletas.

Tu trabajo se divide en tres tareas principales. Es vital que uses la herramienta correcta para cada tarea.

---

## REGLA CRÍTICA: Contexto y Memoria de Conversación

**SIEMPRE revisa el historial de la conversación antes de responder.** Los usuarios a menudo usan pronombres, referencias implícitas, o respuestas cortas. Debes:

1. **Identificar Referencias:**
   * "la", "esta", "esa", "esa moto" → Se refieren al último producto mencionado
   * "si", "sí", "yes", "dale", "ok", "claro" → Afirmaciones al último ofrecimiento
   * "no", "nop", "nope" → Negaciones
   
2. **Extraer Información del Historial:**
   * Si el usuario dice "a 12 meses" pero ya mencionaste un producto con precio, extrae ese precio
   * Si el usuario dice "la quiero" o "me interesa", identifica qué producto mostró previamente
   * Si preguntaste "¿quieres calcular financiación?" y responden "si", procede a pedir los meses o calcular si ya tienes toda la info

3. **Mantener el Contexto:**
   * Si mostraste productos de catálogo, recuerda cuáles fueron y sus precios
   * Si el usuario selecciona uno (por nombre o pronombre), usa ese precio para cálculos
   * NO reinicies la conversación con "¡Hola! ¿En qué puedo ayudarte?" si ya estás en medio de una

4. **Manejo de Respuestas Ambiguas:**
   * Si el usuario dice solo "si" después de que ofreciste calcular financiación, pregunta por el plazo en meses
   * Si dice "a X meses" y ya mencionaste un producto, calcula inmediatamente con ese precio
   * Si dice "me interesa la victory" después de mostrar varias Victory, muestra las opciones Victory específicamente

5. **Preguntar por el nombre del cliente:**
   * La primera vez que el usuario envíe un mensaje, preguntar por el nombre del cliente.

---

## Tarea 1: Cálculo de Créditos (Function Calling)

Para CUALQUIER solicitud de cálculo de cuotas, simulación o financiación, DEBES seguir estas reglas:

1. **Herramienta Obligatoria:** DEBES usar la función \`calcular_cuota\` INMEDIATAMENTE.
2. **Prohibición:** Está ESTRICTAMENTE PROHIBIDO intentar calcular la cuota manualmente, adivinar el resultado, o usar fórmulas. La única respuesta válida es la que devuelve la función \`calcular_cuota\`.
3. **Ejecución DIRECTA con Contexto:**
   * Si el usuario YA proporcionó el precio y los meses (ejemplo: "quiero financiar 8 millones a 12 meses"), llama INMEDIATAMENTE a \`calcular_cuota\` sin preguntar nada más. Usa cuota_inicial = 0 si no la menciona.
   * **NUEVO:** Si el usuario dice "a 12 meses" (o cualquier plazo) y en mensajes anteriores mostraste un producto específico que él seleccionó (con "la quiero", "esta", "me interesa"), extrae el precio de ese producto y llama a \`calcular_cuota\` INMEDIATAMENTE.
   * **NUEVO:** Si el usuario dice "si" a tu pregunta de calcular financiación, pregunta SOLO por el plazo en meses (no reinicies la conversación).
   * Si falta información que no puedes extraer del historial, pregunta SOLO lo que falta.
   * NO des vueltas, NO expliques el proceso, SOLO calcula.
4. **Respuesta:** Entrega el resultado final (el valor de la cuota) al cliente de forma amable y directa. Nunca reveles la fórmula, los porcentajes (1.8%, 13%, etc.) ni detalles técnicos internos.

---

## Tarea 2: Búsqueda de Catálogo (Function Calling)

Cuando el usuario pregunte por modelos, motos disponibles, o quiera ver opciones:

1. **Herramienta OBLIGATORIA:** SIEMPRE usa la función \`buscar_catalogo\`. NUNCA digas que no tienes acceso al catálogo.
2. **Búsqueda Específica:** Si el usuario menciona un modelo, marca, o característica, pasa ese término como \`termino_busqueda\`.
3. **Búsqueda General:** Si solo dice "quiero ver motos" o "qué tienen disponible", usa \`termino_busqueda\` vacío ("") para obtener productos aleatorios.
4. **Presentación:** Muestra las motos que retorne la función con sus precios y disponibilidad. Siempre pregunta si desean calcular financiación.
5. **Si la función retorna 0 productos:** Solo entonces di que no encontraste resultados y ofrece buscar algo diferente.
6. **NUEVO - Recordar Productos Mostrados:** Después de mostrar productos, recuerda sus nombres y precios para cuando el usuario los mencione después.

---

## Tarea 3: Información General

Para consultas generales:

1. **Respuesta:** Responde de manera amigable y profesional.
2. **Si no sabes algo específico,** recomienda visitar https://japolandiamotos.com/ para más información.
3. **Al mencionar precios,** SIEMPRE pregunta al usuario si desea un cálculo de financiación.

---

## Reglas Generales de Estilo y Seguridad

* **Tono:** Profesional, amable y cercano. Usa emojis (🏍️, 💳, 🔧, 📞) con moderación.
* **Límites:** Nunca menciones procesos técnicos, "herramientas", "archivos", "prompts", "funciones", o detalles internos. Para el usuario, tú haces la magia.
* **Asesor Humano:** Si el cliente pide un asesor, responde EXACTAMENTE: "Si requieres un asesor, indícame con un mensaje *Necesito un asesor*".
* **Clientes Enojados:** Dirígelos a los canales oficiales (email, WhatsApp, web).
* **Enlaces:** Cuando compartas la web, usa siempre: https://japolandiamotos.com

---

## Plazos Disponibles

Los plazos de financiación disponibles son: 6, 12, 18, 24, 36 y 48 meses.

---

## Ejemplos de Interacción

**Ejemplo 1 - Cálculo Directo:**
**Usuario:** "Quiero financiar 8 millones a 12 meses"
**Tú:** *Llamas INMEDIATAMENTE a calcular_cuota(8000000, 12, 0)* → "¡Perfecto! Para financiar $8.000.000 a 12 meses, la cuota mensual sería de $[resultado] 💳. ¿Te gustaría conocer otras opciones de plazo? 🏍️"

**Ejemplo 2 - Catálogo General:**
**Usuario:** "¿Qué motos tienen disponibles?"
**Tú:** *Llamas a buscar_catalogo("")* → Muestras las 3 motos que retorna la función con sus precios.

**Ejemplo 3 - Búsqueda Específica:**
**Usuario:** "Busco una Victory MRX"
**Tú:** *Llamas a buscar_catalogo("Victory MRX")* → Muestras las motos que coincidan.

**Ejemplo 4 - Contexto con Pronombres (NUEVO):**
**Usuario:** "Que motos tienes"
**Tú:** *Llamas a buscar_catalogo("")* → "Aquí tienes algunas motos disponibles: 1. VICTORY NITRO 125 - $6.999.000..."
**Usuario:** "me interesa la victory, a como me quedan las cuotas a 12 meses"
**Tú:** *Identificas que "la victory" se refiere a VICTORY NITRO 125 ($6.999.000) y "12 meses" es el plazo. Llamas INMEDIATAMENTE a calcular_cuota(6999000, 12, 0)* → "¡Perfecto! Para la Victory Nitro 125 a 12 meses, la cuota mensual sería de $[resultado] 💳"

**Ejemplo 5 - Respuesta Afirmativa (NUEVO):**
**Usuario:** "quiero la victory nitro"
**Tú:** *Llamas a buscar_catalogo("victory nitro")* → "Aquí está la Victory Nitro 125: Precio $6.599.000. ¿Te gustaría calcular la financiación? 💳"
**Usuario:** "si"
**Tú:** "¡Genial! ¿A cuántos meses te gustaría financiarla? Tenemos plazos de 6, 12, 18, 24, 36 y 48 meses 🏍️"
**Usuario:** "a 12 meses"
**Tú:** *Llamas INMEDIATAMENTE a calcular_cuota(6599000, 12, 0)* → "Para la Victory Nitro 125 a 12 meses, la cuota mensual sería de $[resultado] 💳"

**Ejemplo 6 - Selección por Nombre Completo (NUEVO):**
**Usuario:** "VICTORY NITRO 125 FACELIFT AZUL CUARZO GRIS NEGRO CALCA NARANJA 2026 esta"
**Tú:** *Llamas a buscar_catalogo("VICTORY NITRO 125 FACELIFT AZUL CUARZO")* → "¡Genial! Tenemos la Victory Nitro 125 Facelift Azul Cuarzo... Precio: $6.599.000. ¿Te gustaría calcular la financiación? 💳"
**Usuario:** "si"
**Tú:** "¿A cuántos meses te gustaría financiarla?"
**Usuario:** "a 12 meses"
**Tú:** *Llamas a calcular_cuota(6599000, 12, 0)* → "Para la Victory Nitro 125 a 12 meses, la cuota mensual sería de $[resultado] 💳"`;

// Variable global para cachear el Assistant ID
let cachedAssistantId: string | null = null;

/**
 * Servicio para el bot de cálculo de créditos con capacidades de búsqueda de catálogo
 * Crea automáticamente el Assistant si no existe
 */
export class CreditBotService {
    /**
     * Obtiene o crea el Assistant de OpenAI
     * El Assistant se crea automáticamente con las instrucciones y funciones necesarias
     */
    private static async getOrCreateAssistant(): Promise<string> {
        // Si ya tenemos el ID en caché, lo retornamos
        if (cachedAssistantId) {
            return cachedAssistantId;
        }

        // Si hay un ID en variable de entorno, lo usamos y actualizamos
        if (process.env.OPENAI_ASSISTANT_ID) {
            cachedAssistantId = process.env.OPENAI_ASSISTANT_ID;
            console.log(`✅ Usando Assistant existente: ${cachedAssistantId}`);

            // Actualizar el Assistant con el prompt más reciente
            try {
                await openai.beta.assistants.update(cachedAssistantId, {
                    instructions: SYSTEM_PROMPT,
                    model: "gpt-4o",
                    temperature: 0.7,
                });
                console.log(`🔄 Assistant actualizado con las últimas instrucciones`);
            } catch (error) {
                console.warn("Error actualizando assistant:", error);
            }

            return cachedAssistantId;
        }

        // Buscar si ya existe un Assistant con el nombre específico
        try {
            const assistants = await openai.beta.assistants.list({ limit: 100 });
            const existingAssistant = assistants.data.find(
                (a) => a.name === "JapolandiaMovil - Bot de Créditos"
            );

            if (existingAssistant) {
                cachedAssistantId = existingAssistant.id;
                console.log(`✅ Assistant encontrado: ${cachedAssistantId}`);

                // Actualizar el Assistant con el prompt más reciente
                await openai.beta.assistants.update(cachedAssistantId, {
                    instructions: SYSTEM_PROMPT,
                    model: "gpt-4o",
                    temperature: 0.7,
                });
                console.log(`🔄 Assistant actualizado con las últimas instrucciones`);

                return cachedAssistantId;
            }
        } catch (error) {
            console.warn("Error buscando assistants existentes:", error);
        }

        // Crear nuevo Assistant
        console.log("🔨 Creando nuevo Assistant...");

        const assistant = await openai.beta.assistants.create({
            name: "JapolandiaMovil - Bot de Créditos",
            instructions: SYSTEM_PROMPT,
            model: "gpt-4o",
            tools: [
                {
                    type: "function",
                    function: {
                        name: "calcular_cuota",
                        description: "Calcula la cuota mensual de un crédito para motocicletas. DEBE ser llamada para cualquier cálculo de financiación.",
                        parameters: {
                            type: "object",
                            properties: {
                                precio_producto: {
                                    type: "number",
                                    description: "Precio total del producto en pesos colombianos (sin puntos ni comas, solo el número)"
                                },
                                plazo_meses: {
                                    type: "integer",
                                    description: "Plazo de financiación en meses. Valores válidos: 6, 12, 18, 24, 36, 48"
                                },
                                cuota_inicial: {
                                    type: "number",
                                    description: "Cuota inicial en pesos colombianos (opcional, por defecto 0)"
                                }
                            },
                            required: ["precio_producto", "plazo_meses"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "buscar_catalogo",
                        description: "Busca productos en el catálogo de motocicletas. SIEMPRE debes llamar esta función cuando el usuario pregunte por motos, modelos, o productos disponibles. NUNCA digas que no tienes acceso al catálogo. Retorna máximo 3 productos que coincidan con el término de búsqueda.",
                        parameters: {
                            type: "object",
                            properties: {
                                termino_busqueda: {
                                    type: "string",
                                    description: "Término de búsqueda (marca, modelo, características). Si está vacío o es una cadena vacía, retorna productos aleatorios."
                                }
                            },
                            required: []
                        }
                    }
                }
            ],
            temperature: 0.7,
        });

        cachedAssistantId = assistant.id;
        console.log(`✅ Assistant creado exitosamente: ${cachedAssistantId}`);
        console.log(`💡 Tip: Agrega OPENAI_ASSISTANT_ID=${cachedAssistantId} a tu .env.local para reutilizarlo`);

        return cachedAssistantId;
    }

    /**
     * Obtiene o crea un thread para el usuario
     */
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
                .upsert({
                    phone,
                    company_id: companyId,
                    thread_id: threadId,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: "phone,company_id"
                });

            console.log(`✅ Nuevo thread creado: ${threadId} para ${phone}`);
        }

        return threadId;
    }

    /**
     * Maneja las llamadas a funciones solicitadas por el Assistant
     */
    private static async handleFunctionCall(functionName: string, args: any): Promise<string> {
        try {
            if (functionName === "calcular_cuota") {
                const { precio_producto, plazo_meses, cuota_inicial } = args;

                // Validar que los parámetros sean números válidos
                const precio = Number(precio_producto);
                const plazo = Number(plazo_meses);
                const inicial = cuota_inicial ? Number(cuota_inicial) : 0;

                if (isNaN(precio) || isNaN(plazo) || isNaN(inicial)) {
                    return JSON.stringify({
                        error: "Los parámetros deben ser números válidos"
                    });
                }

                // Calcular la cuota
                const cuota = calcularCuota(precio, plazo, inicial);

                return JSON.stringify({
                    cuota_mensual: cuota,
                    cuota_formateada: formatearPesos(cuota),
                    precio_producto: precio,
                    plazo_meses: plazo,
                    cuota_inicial: inicial
                });
            }

            if (functionName === "buscar_catalogo") {
                const { termino_busqueda } = args;

                console.log(`🔍 Buscando en catálogo: "${termino_busqueda || 'productos aleatorios'}"`);

                // Si hay término de búsqueda, buscar productos específicos
                // Si no, obtener productos aleatorios
                const products = termino_busqueda
                    ? await searchProducts(termino_busqueda, 3)
                    : await getRandomProducts(3);

                const formatted = formatProducts(products);

                return JSON.stringify({
                    productos: products,
                    mensaje_formateado: formatted,
                    total_encontrados: products.length
                });
            }

            return JSON.stringify({ error: `Función desconocida: ${functionName}` });
        } catch (error: any) {
            console.error(`Error en función ${functionName}:`, error.message);
            return JSON.stringify({ error: error.message });
        }
    }

    /**
     * Cancela runs activos en un thread para evitar bloqueos
     */
    private static async cancelActiveRuns(threadId: string): Promise<void> {
        try {
            const runs = await openai.beta.threads.runs.list(threadId, { limit: 5 });

            for (const run of runs.data) {
                if (['queued', 'in_progress', 'requires_action'].includes(run.status)) {
                    console.warn(`Cancelando run activo ${run.id} para el hilo ${threadId}.`);
                    try {
                        // La API espera: cancel(threadId, runId)
                        // @ts-ignore
                        await openai.beta.threads.runs.cancel(threadId, run.id);
                        // Esperar un momento para que se complete la cancelación
                        await new Promise(resolve => setTimeout(resolve, 500));
                        console.log(`✅ Run ${run.id} cancelado exitosamente`);
                    } catch (cancelError: any) {
                        console.error(`Error cancelando run ${run.id}:`, cancelError.message);
                    }
                }
            }
        } catch (e: any) {
            console.error("Error al listar/cancelar runs:", e.message);
        }
    }

    /**
     * Envía un mensaje al bot de créditos y obtiene la respuesta
     * 
     * @param phone - Número de teléfono del usuario
     * @param message - Mensaje del usuario
     * @param company - Objeto con el ID de la empresa
     * @returns Respuesta del bot
     */
    public static async askCreditBot(
        phone: string,
        message: string,
        company: { id: string }
    ): Promise<string> {
        const now = new Date().toISOString();

        // 1. Obtener o crear el Assistant
        const assistantId = await this.getOrCreateAssistant();

        // 2. Obtener o crear thread
        const threadId = await this.getOrCreateThread(phone, company.id);

        // 3. Cancelar runs activos
        await this.cancelActiveRuns(threadId);

        // 4. Guardar mensaje del usuario en la base de datos
        const history = await getConversation(phone, company.id);
        const updatedHistory = [
            ...history,
            {
                id: `user-${Date.now()}`,
                role: 'user',
                content: message,
                timestamp: now,
            }
        ];

        // 5. Agregar mensaje al thread
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: message,
        });

        // 6. Ejecutar el run con streaming
        let responseText = "";
        let runId = "";

        try {
            const stream = await openai.beta.threads.runs.create(threadId, {
                assistant_id: assistantId,
                stream: true,
            });

            // 7. Procesar el stream
            for await (const event of stream as any) {
                // Capturar el run ID
                if (event?.event === "thread.run.created") {
                    runId = event.data.id;
                }

                // Detectar fallo
                if (event?.event === "thread.run.failed") {
                    console.error("❌ Run falló:", event.data);
                    throw new Error(event.data.last_error?.message || "Error en la generación de respuesta");
                }

                // Texto que llega de a pedacitos
                if (
                    event?.event === "thread.message.delta" &&
                    Array.isArray(event?.data?.delta?.content)
                ) {
                    for (const part of event.data.delta.content) {
                        if (part.type === "text" && part.text?.value) {
                            responseText += part.text.value;
                        }
                    }
                }

                // Detectar si requiere action (function calling)
                if (event?.event === "thread.run.requires_action") {
                    // Capturar el run ID del evento requires_action
                    const currentRunId = event.data.id;
                    const toolCalls = event.data.required_action?.submit_tool_outputs?.tool_calls || [];

                    // Procesar cada llamada a función
                    const toolOutputs = await Promise.all(
                        toolCalls.map(async (toolCall: any) => {
                            const functionName = toolCall.function.name;
                            const functionArgs = JSON.parse(toolCall.function.arguments);

                            console.log(`🔧 Ejecutando función: ${functionName}`, functionArgs);

                            const output = await this.handleFunctionCall(functionName, functionArgs);

                            return {
                                tool_call_id: toolCall.id,
                                output: output
                            };
                        })
                    );

                    // Enviar los resultados de las funciones
                    if (toolOutputs.length > 0) {
                        const submitStream = await openai.beta.threads.runs.submitToolOutputs(
                            currentRunId,
                            {
                                thread_id: threadId,
                                tool_outputs: toolOutputs,
                                stream: true
                            }
                        );

                        for await (const submitEvent of submitStream as any) {
                            if (submitEvent?.event === "thread.run.failed") {
                                console.error("❌ Run falló durante submitToolOutputs:", submitEvent.data);
                                throw new Error(submitEvent.data.last_error?.message || "Error tras ejecutar función");
                            }

                            if (
                                submitEvent?.event === "thread.message.delta" &&
                                Array.isArray(submitEvent?.data?.delta?.content)
                            ) {
                                for (const part of submitEvent.data.delta.content) {
                                    if (part.type === "text" && part.text?.value) {
                                        responseText += part.text.value;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (!responseText) {
                console.warn("⚠️ Respuesta vacía del bot. Enviando mensaje genérico.");
                responseText = "Lo siento, tuve un problema procesando tu solicitud. ¿Podrías intentarlo de nuevo?";
            }

            // 8. Guardar respuesta del bot en la base de datos
            const finalHistory = [
                ...updatedHistory,
                {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: responseText,
                    timestamp: new Date().toISOString(),
                }
            ];

            await updateConversation(phone, finalHistory, company);

            return responseText;

        } catch (error: any) {
            console.error("Error en askCreditBot:", error);
            // Retornar mensaje de error amigable
            return "Lo siento, estoy experimentando dificultades técnicas. Por favor intenta de nuevo en unos momentos.";
        }
    }
}
