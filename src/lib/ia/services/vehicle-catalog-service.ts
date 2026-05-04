import { promises as fs } from "fs";
import path from "path";

export type MotoCategory =
    | "sport"
    | "trabajo"
    | "scooter"
    | "enduro"
    | "alta_gama"
    | "motocarro"
    | "electrica";

export type MotoCatalogItem = {
    linea: string;
    marca: string;
    categoria: MotoCategory;
    folderPath: string;
    imagePaths: string[];
    txtPath?: string;
    relatedPrices: string[];
};

type CatalogCache = {
    items: MotoCatalogItem[];
    loadedAt: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000;
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

function inferCategoryFromFolder(folderPath: string, linea: string): MotoCategory {
    const lower = folderPath.toLowerCase();
    const ref = normalizeText(linea);

    if (/motocarro|ceronte|king delux|tricargo/.test(lower)) return "motocarro";
    if (/iqube|electrica/.test(lower)) return "electrica";
    if (/trkku|trakk|agility|kymco|skytown|xconnect|ntorq|neo nx|dazz|new life|bet|onemp trakku|advancer.*trakku/.test(lower))
        return "scooter";
    if (/sport[\s_]100|sport100|sport_100/.test(lower) || /sport 100|sport100/i.test(ref)) return "scooter";
    if (/apache|rtr|raider|stryker|ronin|sport(?![\s_]?100)|venom|identity|rtsx/.test(lower)) return "sport";
    if (/combat|bomber|nitro|switch|betty|bomber125|switch125/.test(lower)) return "trabajo";
    if (/mrx.*(200|150|125)|xplore|arizona|klx|wr /.test(lower)) return "enduro";
    if (/z[0-9]|ninja|versys|mule|jet ski|brute|teryx|leoncino|trk|imperial/.test(lower)) return "alta_gama";
    return "trabajo";
}

function extractFirstLine(raw: string): string {
    const lines = raw.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && trimmed.length > 3) return trimmed;
    }
    return "";
}

async function collectFolderData(folderPath: string): Promise<{ images: string[]; txt?: string; txtContent?: string }> {
    const images: string[] = [];
    let txt: string | undefined;
    let txtContent: string | undefined;
    try {
        const files = await fs.readdir(folderPath);
        for (const file of files) {
            if (/\.(png|jpg|jpeg|webp)$/i.test(file)) {
                images.push(path.join(folderPath, file));
            }
            if (file.endsWith(".txt") && !/index|vehicle/i.test(file)) {
                const content = await fs.readFile(path.join(folderPath, file), "utf8");
                if (!txt) {
                    txt = path.join(folderPath, file);
                    txtContent = content;
                }
            }
        }
    } catch {
    }
    return { images, txt, txtContent };
}

function extractLineaFromTxt(txtContent: string | undefined, folderName: string): string {
    if (txtContent) {
        const first = extractFirstLine(txtContent).replace(/\*\*/g, "").replace(/##/g, "").trim();
        if (first.length > 3 && first.length < 80) return first;
    }
    return folderName.replace(/[_\-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function scanFolders(
    root: string,
    brand: string
): Promise<Array<{ linea: string; marca: string; folderPath: string; images: string[]; txt?: string }>> {
    const results: Array<{ linea: string; marca: string; folderPath: string; images: string[]; txt?: string }> = [];
    let entries: string[];
    try {
        entries = await fs.readdir(root);
    } catch {
        return [];
    }

    for (const entry of entries) {
        const full = path.join(root, entry);
        let stat;
        try {
            stat = await fs.stat(full);
        } catch {
            continue;
        }
        if (!stat.isDirectory()) continue;
        if (/index|events|prices|technology/i.test(entry)) continue;

        const { images, txt, txtContent } = await collectFolderData(full);
        const linea = extractLineaFromTxt(txtContent, entry);
        results.push({ linea, marca: brand, folderPath: full, images, txt });
    }

    return results;
}

async function buildCatalog(): Promise<MotoCatalogItem[]> {
    const rootDir = path.join(process.cwd(), "data", "RAG_IA_AUTECO");
    const allItems: MotoCatalogItem[] = [];

    const folders = [
        { root: path.join(rootDir, "tvs", "vehicles"), brand: "TVS" },
        { root: path.join(rootDir, "victory", "vehicles", "victory"), brand: "VICTORY" },
        { root: path.join(rootDir, "victory", "vehicles", "kymco"), brand: "KYMCO" },
        { root: path.join(rootDir, "victory", "vehicles", "ceronte"), brand: "CERONTE" },
        { root: path.join(rootDir, "victory", "vehicles", "outgoing"), brand: "OUTGOING" },
    ];

    for (const { root, brand } of folders) {
        const scanned = await scanFolders(root, brand);
        for (const item of scanned) {
            allItems.push({
                linea: item.linea,
                marca: item.marca,
                categoria: inferCategoryFromFolder(item.folderPath, item.linea),
                folderPath: item.folderPath,
                imagePaths: item.images,
                txtPath: item.txt,
                relatedPrices: [],
            });
        }
    }

    return allItems;
}

export async function getMotoCatalog(): Promise<MotoCatalogItem[]> {
    const now = Date.now();
    if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
        return cache.items;
    }

    const items = await buildCatalog();
    cache = { items, loadedAt: now };
    return items;
}

export async function searchCatalog(
    query: string,
    opts?: { category?: MotoCategory; brand?: string; limit?: number }
): Promise<MotoCatalogItem[]> {
    const catalog = await getMotoCatalog();
    const normQ = normalizeText(query);
    const tokens = normQ.split(" ").filter((t) => t.length >= 2);

    let filtered = catalog.filter((item) => {
        if (opts?.category && item.categoria !== opts.category) return false;
        if (opts?.brand && normalizeText(item.marca) !== normalizeText(opts.brand)) return false;
        if (!tokens.length) return true;
        const haystack = normalizeText(`${item.marca} ${item.linea}`);
        return tokens.some((t) => haystack.includes(t));
    });

    if (!filtered.length && tokens.length && !opts?.category && !opts?.brand) {
        filtered = catalog.filter((item) => {
            const haystack = normalizeText(`${item.marca} ${item.linea}`);
            return tokens.some((t) => haystack.includes(t) || t.includes(haystack));
        });
    }

    return filtered.slice(0, opts?.limit ?? 10);
}

export async function findCatalogItem(linea: string): Promise<MotoCatalogItem | null> {
    const catalog = await getMotoCatalog();
    const normLinea = normalizeText(linea);
    return (
        catalog.find((item) => normalizeText(item.linea) === normLinea) ||
        catalog.find(
            (item) =>
                normalizeText(item.linea).includes(normLinea) ||
                normLinea.includes(normalizeText(item.linea))
        ) ||
        null
    );
}

export async function getCatalogSummary(): Promise<Record<string, MotoCatalogItem[]>> {
    const catalog = await getMotoCatalog();
    const brands = [...new Set(catalog.map((i) => i.marca))];
    const summary: Record<string, MotoCatalogItem[]> = {};
    for (const brand of brands) {
        summary[brand] = catalog.filter((i) => i.marca === brand);
    }
    return summary;
}
