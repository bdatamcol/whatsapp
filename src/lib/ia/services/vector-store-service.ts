import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
});

const VECTOR_STORE_NAME = "auteco-motos-kb";
const FILE_BATCH_SIZE = 100;

let cachedVectorStoreId: string | null = null;

export async function getVectorStoreId(): Promise<string | null> {
    if (cachedVectorStoreId) return cachedVectorStoreId;
    if (!process.env.OPENAI_API_KEY?.startsWith("sk-")) return null;

    try {
        const vectorStores = await openai.vectorStores.list({ limit: 50 });
        const found = vectorStores.data.find(
            (vs) => vs.name === VECTOR_STORE_NAME || vs.name?.includes("auteco")
        );
        if (found) {
            cachedVectorStoreId = found.id;
            return found.id;
        }
    } catch (e) {
        console.warn("[VectorStore] No se pudo listar vector stores:", e);
    }
    return null;
}

export async function createVectorStoreIfNeeded(): Promise<string> {
    const existing = await getVectorStoreId();
    if (existing) return existing;

    const vs = await openai.vectorStores.create({
        name: VECTOR_STORE_NAME,
        expires_after: { anchor: "last_active", days: 30 },
    });
    cachedVectorStoreId = vs.id;
    console.log(`[VectorStore] Creado: ${vs.id}`);
    return vs.id;
}

async function collectTxtFiles(rootDir: string): Promise<string[]> {
    const output: string[] = [];
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(rootDir, entry.name);
        if (entry.isDirectory()) {
            output.push(...(await collectTxtFiles(full)));
        } else if (entry.isFile() && /\.txt$/i.test(entry.name)) {
            output.push(full);
        }
    }
    return output;
}

async function uploadFileInBatches(
    vectorStoreId: string,
    filePaths: string[]
): Promise<void> {
    for (let i = 0; i < filePaths.length; i += FILE_BATCH_SIZE) {
        const batch = filePaths.slice(i, i + FILE_BATCH_SIZE);
        const fileStreams = await Promise.all(
            batch.map(async (filePath) => {
                const buffer = await fs.readFile(filePath);
                const fileName = path.basename(filePath);
                const { file } = await openai.files.create({
                    file: new File([buffer], fileName, { type: "text/plain" }),
                    purpose: "assistants",
                });
                return file;
            })
        );
        await openai.vectorStores.vectorStoresFilesBatchCreateAndPoll(
            vectorStoreId,
            { file_ids: fileStreams.map((f) => f.id) }
        );
        console.log(
            `[VectorStore] Subidos ${Math.min(i + FILE_BATCH_SIZE, filePaths.length)}/${
                filePaths.length
            } archivos`
        );
    }
}

export async function syncRagFilesToVectorStore(): Promise<string> {
    const vectorStoreId = await createVectorStoreIfNeeded();

    const ragRoot = path.join(process.cwd(), "data", "RAG_IA_AUTECO");
    const filePaths = await collectTxtFiles(ragRoot);
    console.log(`[VectorStore] Encontrados ${filePaths.length} archivos .txt para subir`);

    await uploadFileInBatches(vectorStoreId, filePaths);
    return vectorStoreId;
}

export interface RetrievalResult {
    content: string;
    source: string;
    score?: number;
}

export async function retrieveFromVectorStore(
    query: string,
    vectorStoreId: string,
    opts?: { maxResults?: number }
): Promise<RetrievalResult[]> {
    try {
        const response = await openai.responses.create({
            model: "gpt-4.1-2025-04-14",
            input: query,
            tools: [
                {
                    type: "file_search",
                    vector_store_ids: [vectorStoreId],
                    max_results: opts?.maxResults ?? 5,
                },
            ],
        });

        const results: RetrievalResult[] = [];
        for (const output of response.output) {
            if (output.type === "file_search_call_output") {
                for (const doc of output.documents) {
                    results.push({
                        content: doc.content?.[0]?.text ?? "",
                        source: doc.filename ?? "desconocido",
                        score: doc.chunks?.length,
                    });
                }
            }
        }
        return results;
    } catch (e) {
        console.error("[VectorStore] Error en retrieval:", e);
        return [];
    }
}

export async function ensureVectorStoreReady(): Promise<string> {
    const existing = await getVectorStoreId();
    if (existing) return existing;
    return syncRagFilesToVectorStore();
}
