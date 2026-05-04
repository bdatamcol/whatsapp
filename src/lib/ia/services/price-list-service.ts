import { promises as fs } from "fs";
import path from "path";
import {
    getMotoCatalog,
    searchCatalog,
    type MotoCatalogItem,
    type MotoCategory,
} from "./vehicle-catalog-service";

export type MotoPrice = {
    marca: string;
    referencia: string;
    modelo: number;
    precioBase: number;
    bonoDescuento: number | null;
    bonoFinanciera: string | null;
    variante?: string;
    beneficios?: string;
    categoria: MotoCategory;
    imagePaths: string[];
    txtPath?: string;
};

type PriceCache = {
    prices: MotoPrice[];
    loadedAt: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000;
let cache: PriceCache | null = null;

function normalizeText(input: string): string {
    return (input || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function parseMoney(raw: string | number): number {
    if (typeof raw === "number") return raw;
    const cleaned = `${raw}`.replace(/[^\d]/g, "");
    return Number(cleaned) || 0;
}

function extractJsonBlocks(text: string): string[] {
    const blocks: string[] = [];
    let depth = 0;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "{") {
            if (depth === 0) start = i;
            depth++;
        } else if (text[i] === "}") {
            depth--;
            if (depth === 0 && start !== -1) {
                blocks.push(text.slice(start, i + 1));
                start = -1;
            }
        }
    }
    return blocks;
}

type RawPriceEntry = {
    marca?: string;
    referencia_moto?: string;
    referencia?: string;
    precio_base: string | number;
    año_modelo?: number;
    bono_descuento?: string | number;
    bono_financiando_progreser?: string;
    variante?: string;
    beneficios?: string;
};

function parsePriceEntry(raw: string, marcaDefault?: string): RawPriceEntry | null {
    try {
        const obj = JSON.parse(raw) as RawPriceEntry;
        const ref = obj.referencia_moto || obj.referencia || "";
        if (!ref) return null;
        const precioBase = parseMoney(obj.precio_base);
        if (precioBase <= 0) return null;
        return obj;
    } catch {
        return null;
    }
}

async function loadPriceFile(filePath: string): Promise<RawPriceEntry[]> {
    try {
        const raw = await fs.readFile(filePath, "utf8");
        return extractJsonBlocks(raw)
            .map((b) => parsePriceEntry(b))
            .filter(Boolean) as RawPriceEntry[];
    } catch {
        return [];
    }
}

function scoreMatch(catalogLinea: string, priceRef: string): number {
    const c = normalizeText(catalogLinea);
    const p = normalizeText(priceRef);
    if (c === p) return 100;
    if (p.includes(c) || c.includes(p)) return 80;
    const cTokens = c.split(" ").filter((t) => t.length >= 2);
    const pTokens = p.split(" ").filter((t) => t.length >= 2);
    const overlap = cTokens.filter((t) => pTokens.some((pt) => pt.includes(t) || t.includes(pt)));
    return overlap.length * 15 + Math.min(cTokens.length, pTokens.length) * 5;
}

function matchCatalogToPrice(catalogItem: MotoCatalogItem, prices: RawPriceEntry[]): RawPriceEntry | null {
    const linea = catalogItem.linea;
    let best: RawPriceEntry | null = null;
    let bestScore = 0;

    for (const price of prices) {
        const ref = price.referencia_moto || price.referencia || "";
        const score = scoreMatch(linea, ref);
        if (score > bestScore) {
            bestScore = score;
            best = price;
        }
    }

    return bestScore >= 15 ? best : null;
}

async function buildPricesFromCatalog(): Promise<MotoPrice[]> {
    const [catalog, tvsPrices, victoryPrices] = await Promise.all([
        getMotoCatalog(),
        loadPriceFile(path.join(process.cwd(), "data", "RAG_IA_AUTECO", "prices.txt")),
        loadPriceFile(path.join(process.cwd(), "data", "RAG_IA_AUTECO", "victory", "lista_precios_victory.txt")),
    ]);

    const allPrices = [...tvsPrices, ...victoryPrices];
    const resultsByLinea = new Map<string, MotoPrice>();

    for (const item of catalog) {
        const matched = matchCatalogToPrice(item, allPrices);
        const precioBase = matched ? parseMoney(matched.precio_base) : 0;
        const bonoRaw = matched?.bono_descuento;
        let bonoDescuento: number | null = null;
        if (typeof bonoRaw === "number" && bonoRaw > 0) {
            bonoDescuento = bonoRaw;
        } else if (typeof bonoRaw === "string") {
            const n = parseMoney(bonoRaw);
            if (n > 0) bonoDescuento = n;
        }

        const key = `${item.marca}::${normalizeText(item.linea)}`;
        const existing = resultsByLinea.get(key);
        if (existing && existing.precioBase > 0 && precioBase === 0) continue;
        if (existing && existing.precioBase > 0 && precioBase > 0 && existing.precioBase <= precioBase) continue;

        resultsByLinea.set(key, {
            marca: item.marca,
            referencia: matched ? (matched.referencia_moto || matched.referencia || item.linea).toUpperCase() : item.linea,
            modelo: Number(matched?.año_modelo) || 2026,
            precioBase,
            bonoDescuento,
            bonoFinanciera: matched?.bono_financiando_progreser || null,
            variante: matched?.variante,
            beneficios: matched?.beneficios,
            categoria: item.categoria,
            imagePaths: item.imagePaths,
            txtPath: item.txtPath,
        });
    }

    return Array.from(resultsByLinea.values());
}

export async function getMotoPriceList(): Promise<MotoPrice[]> {
    const now = Date.now();
    if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
        return cache.prices;
    }

    const prices = await buildPricesFromCatalog();
    cache = { prices, loadedAt: now };
    return cache.prices;
}

export async function searchPrices(
    query: string,
    opts?: { category?: MotoCategory; brand?: string; limit?: number }
): Promise<MotoPrice[]> {
    const list = await getMotoPriceList();
    const normQ = normalizeText(query);
    const tokens = normQ.split(" ").filter((t) => t.length >= 2);

    let filtered = list.filter((p) => {
        if (opts?.category && p.categoria !== opts.category) return false;
        if (opts?.brand && normalizeText(p.marca) !== normalizeText(opts.brand)) return false;
        return true;
    });

    if (tokens.length > 0) {
        const tokenMatched = filtered.filter((p) => {
            const haystack = normalizeText(`${p.marca} ${p.referencia}`);
            return tokens.some((t) => haystack.includes(t));
        });
        if (tokenMatched.length > 0) filtered = tokenMatched;
    }

    filtered.sort((a, b) => a.precioBase - b.precioBase);
    return filtered.slice(0, opts?.limit ?? 20);
}

export async function findExactPrice(linea: string): Promise<MotoPrice | null> {
    const list = await getMotoPriceList();
    const normLinea = normalizeText(linea);
    return (
        list.find((p) => normalizeText(p.referencia) === normLinea) ||
        list.find((p) => normalizeText(p.referencia).includes(normLinea) || normLinea.includes(normalizeText(p.referencia))) ||
        null
    );
}

export function formatPriceEntry(p: MotoPrice): string {
    const priceStr = `$${p.precioBase.toLocaleString("es-CO")}`;
    let bonoStr = "";
    if (p.bonoDescuento && p.bonoDescuento > 0) {
        bonoStr = ` | Bono: $${p.bonoDescuento.toLocaleString("es-CO")}`;
    }
    return `${p.referencia} - ${priceStr}${bonoStr}`;
}
