import { promises as fs } from "fs";
import path from "path";

export type RagMotoCatalogItem = {
    name: string;
    brand?: string;
    category: "scooter" | "trabajo" | "sport" | "enduro" | "semiautomatica" | "alta_gama";
    price?: number;
    summary?: string;
    txtPath: string;
    imagePaths: string[];
    slug: string;
};

type PriceEntry = {
    ref: string;
    normalizedRef: string;
    price?: number;
};

type CatalogCache = {
    items: RagMotoCatalogItem[];
    loadedAt: number;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: CatalogCache | null = null;

function normalizeText(input: string): string {
    return (input || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(input: string): string[] {
    return normalizeText(input)
        .split(" ")
        .filter((t) => t.length >= 2);
}

function parseMoneyValue(raw: string): number | undefined {
    const input = `${raw || ""}`.trim();
    if (!input) return undefined;
    if (normalizeText(input).includes("proxim")) return undefined;

    const numericOnly = input.replace(/[^\d.,]/g, "");
    if (!numericOnly) return undefined;

    const isThousandGrouped = /^\d{1,3}(?:[.,]\d{3})+$/.test(numericOnly);
    const normalized = isThousandGrouped
        ? numericOnly.replace(/[.,]/g, "")
        : numericOnly.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return Math.round(parsed);
}

function inferCategory(raw: string): RagMotoCatalogItem["category"] {
    const text = normalizeText(raw);
    if (/(combat|bomber|nitro|switch|trabajo|delivery|mensaj|tricargo|motocarro|carga|cargo)/.test(text)) return "trabajo";
    if (/(agility|ntorq|scooter|new life|bet|dazz|neo|iqube)/.test(text)) return "scooter";
    if (/(apache|raider|sport|venom|ronin|rtr|stryker|x1)/.test(text)) return "sport";
    if (/(mrx|enduro|trail|arizona|xplore)/.test(text)) return "enduro";
    return "alta_gama";
}

async function collectFiles(dir: string): Promise<string[]> {
    const out: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...(await collectFiles(fullPath)));
        } else {
            out.push(fullPath);
        }
    }
    return out;
}

function extractObjectsBlock(raw: string): string[] {
    const blocks: string[] = [];
    const matches = raw.match(/\{[\s\S]*?\}/g) || [];
    for (const block of matches) {
        blocks.push(block);
    }
    return blocks;
}

async function loadPriceEntries(rootDir: string): Promise<PriceEntry[]> {
    const files = await collectFiles(rootDir);
    const priceFiles = files.filter((f) => /prices_offers[\\\/]prices\.txt$/i.test(f));
    const entries: PriceEntry[] = [];

    for (const filePath of priceFiles) {
        const raw = await fs.readFile(filePath, "utf8");
        for (const block of extractObjectsBlock(raw)) {
            const refMatch = block.match(/"referencia_moto"\s*:\s*"([^"]+)"/i);
            const priceMatch = block.match(/"precio_base"\s*:\s*("[^"]+"|\d+(?:[.,]\d+)?)/i);
            if (!refMatch?.[1]) continue;

            const ref = refMatch[1].trim();
            const rawPrice = priceMatch?.[1]?.replace(/^"|"$/g, "") || "";
            entries.push({
                ref,
                normalizedRef: normalizeText(ref),
                price: parseMoneyValue(rawPrice),
            });
        }
    }

    return entries;
}

function scoreMatch(source: string, target: string): number {
    const a = tokenize(source);
    const b = tokenize(target);
    if (!a.length || !b.length) return 0;
    const setB = new Set(b);
    let score = 0;
    for (const token of a) {
        if (setB.has(token)) score += 2;
        else if (b.some((x) => x.includes(token) || token.includes(x))) score += 1;
    }
    return score;
}

function resolvePrice(nameCandidates: string[], priceEntries: PriceEntry[]): number | undefined {
    let best: { score: number; price?: number } = { score: 0 };

    for (const candidate of nameCandidates) {
        const normalizedCandidate = normalizeText(candidate);
        const candidateNumbers = normalizedCandidate.match(/\b\d{2,4}\b/g) || [];
        for (const entry of priceEntries) {
            let score =
                scoreMatch(normalizedCandidate, entry.normalizedRef) +
                scoreMatch(entry.normalizedRef, normalizedCandidate);

            if (candidateNumbers.length > 0) {
                const hasNumberMatch = candidateNumbers.some((num) => entry.normalizedRef.includes(num));
                if (!hasNumberMatch) {
                    score -= 6;
                } else {
                    score += 2;
                }
            }

            if (score > best.score && entry.price) {
                best = { score, price: entry.price };
            }
        }
    }

    return best.score >= 6 ? best.price : undefined;
}

function prettifyName(slugOrFileName: string): string {
    return slugOrFileName
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}

function cleanLine(raw: string): string {
    return (raw || "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function extractTitleAndSummary(rawText: string, fallbackName: string): { title: string; summary?: string } {
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => cleanLine(line))
        .filter((line) => line.length > 0);

    const markdownTitle = rawText.match(/\*\*([^*]+)\*\*/);
    if (markdownTitle?.[1]) {
        const title = cleanLine(markdownTitle[1]).toUpperCase();
        const summaryLine = lines.find((line) => line.length > 45 && line.length <= 220);
        return {
            title: title || fallbackName,
            summary: summaryLine ? summaryLine.slice(0, 170) : undefined,
        };
    }

    const titleCandidate = lines.find((line) => line.length >= 4 && line.length <= 70);
    const title = (titleCandidate || fallbackName).toUpperCase();

    const summary = lines.find((line) => line !== titleCandidate && line.length > 45 && line.length <= 220);
    return {
        title,
        summary: summary ? summary.slice(0, 170) : undefined,
    };
}

async function buildCatalog(rootDir: string): Promise<RagMotoCatalogItem[]> {
    const files = await collectFiles(rootDir);
    const txtFiles = files.filter((f) => f.toLowerCase().endsWith(".txt"));
    const priceEntries = await loadPriceEntries(rootDir);
    const items: RagMotoCatalogItem[] = [];

    for (const txtPath of txtFiles) {
        const normalizedPath = txtPath.replace(/\\/g, "/");
        if (!normalizedPath.includes("/vehicles/")) continue;
        if (/\/(index|identity|outgoing)\//i.test(normalizedPath)) continue;
        if (/prices_offers/i.test(normalizedPath)) continue;

        const dirPath = path.dirname(txtPath);
        const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
        const imagePaths = dirEntries
            .filter((e) => e.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(e.name))
            .map((e) => path.join(dirPath, e.name));

        const rawText = await fs.readFile(txtPath, "utf8");
        const firstLine = rawText.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim();

        const dirName = path.basename(dirPath);
        const fileBaseName = path.basename(txtPath, path.extname(txtPath));
        const fallbackName = firstLine && firstLine.length >= 4 ? firstLine : prettifyName(fileBaseName || dirName);
        const { title, summary } = extractTitleAndSummary(rawText, fallbackName);

        const rel = path.relative(rootDir, dirPath).replace(/\\/g, "/");
        const parts = rel.split("/").filter(Boolean);
        const brand = parts[0]?.toUpperCase();

        const candidates = [title, dirName, fileBaseName];
        const resolvedPrice = resolvePrice(candidates, priceEntries);
        const category = inferCategory(`${title} ${dirName} ${fileBaseName}`);

        items.push({
            name: title,
            brand,
            category,
            price: resolvedPrice,
            summary,
            txtPath,
            imagePaths,
            slug: normalizeText(`${brand || ""} ${dirName}`).replace(/\s+/g, "-"),
        });
    }

    // Dedup por nombre+marca, priorizando con precio y con imagen
    const byKey = new Map<string, RagMotoCatalogItem>();
    for (const item of items) {
        const key = `${normalizeText(item.brand || "")}::${normalizeText(item.name)}`;
        const current = byKey.get(key);
        if (!current) {
            byKey.set(key, item);
            continue;
        }

        const currentScore = (current.price ? 2 : 0) + (current.imagePaths.length ? 1 : 0);
        const nextScore = (item.price ? 2 : 0) + (item.imagePaths.length ? 1 : 0);
        if (nextScore > currentScore) {
            byKey.set(key, item);
        }
    }

    return Array.from(byKey.values());
}

export async function getRagMotoCatalog(): Promise<RagMotoCatalogItem[]> {
    const now = Date.now();
    if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
        return cache.items;
    }

    const rootDir = path.join(process.cwd(), "data", "RAG_IA_AUTECO");
    const items = await buildCatalog(rootDir);
    cache = { items, loadedAt: now };
    return items;
}

export async function searchRagMotoCatalog(
    query: string,
    opts?: { category?: RagMotoCatalogItem["category"] | null; limit?: number }
): Promise<RagMotoCatalogItem[]> {
    const catalog = await getRagMotoCatalog();
    const q = normalizeText(query);
    const limit = opts?.limit ?? 3;
    const category = opts?.category;

    const scored = catalog
        .filter((item) => !category || item.category === category)
        .map((item) => {
            const hay = `${item.brand || ""} ${item.name} ${item.slug} ${item.category}`;
            const score = scoreMatch(q, hay) + scoreMatch(hay, q);
            return { item, score };
        })
        .filter((row) => row.score > 0 || !q)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const aPrice = a.item.price || Number.MAX_SAFE_INTEGER;
            const bPrice = b.item.price || Number.MAX_SAFE_INTEGER;
            return aPrice - bPrice;
        })
        .slice(0, limit)
        .map((row) => row.item);

    return scored;
}

export async function resolveRagMotoByText(text: string): Promise<RagMotoCatalogItem | null> {
    const matches = await searchRagMotoCatalog(text, { limit: 1 });
    return matches[0] || null;
}
