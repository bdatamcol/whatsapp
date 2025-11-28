/**
 * Servicio para gestionar el catálogo de productos con caché
 * Se actualiza automáticamente cada 8 horas (3 veces al día)
 */

interface Product {
    cod_item: string;
    des_item: string;
    existencia: number;
    precio_final: number;
    por_iva: number;
}

interface CatalogCache {
    data: Product[];
    lastFetch: number;
    ttl: number; // Time to live en milisegundos
}

// Caché en memoria
let catalogCache: CatalogCache | null = null;

// TTL de 8 horas (3 veces al día)
const CACHE_TTL = 8 * 60 * 60 * 1000; // 8 horas en milisegundos

/**
 * Obtiene el catálogo de productos desde el endpoint o desde caché
 */
export async function getCatalog(): Promise<Product[]> {
    const now = Date.now();

    // Si hay caché válido, retornarlo
    if (catalogCache && (now - catalogCache.lastFetch) < catalogCache.ttl) {
        console.log('📦 Usando catálogo desde caché');
        return catalogCache.data;
    }

    // Si no hay caché o expiró, hacer fetch
    console.log('🔄 Actualizando catálogo desde endpoint...');

    try {
        const endpoint = process.env.CATALOG_ENDPOINT_URL;

        if (!endpoint) {
            console.warn('⚠️ CATALOG_ENDPOINT_URL no configurado, usando catálogo vacío');
            return [];
        }

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Filtrar productos con precio > 0 y existencia > 0
        const products: Product[] = result.data
            .filter((p: Product) => p.precio_final > 0 && p.existencia > 0)
            .map((p: Product) => ({
                cod_item: p.cod_item.trim(),
                des_item: p.des_item.trim(),
                existencia: p.existencia,
                precio_final: Math.round(p.precio_final),
                por_iva: p.por_iva
            }));

        // Guardar en caché
        catalogCache = {
            data: products,
            lastFetch: now,
            ttl: CACHE_TTL
        };

        console.log(`✅ Catálogo actualizado: ${products.length} productos disponibles`);
        return products;

    } catch (error: any) {
        console.error('❌ Error al obtener catálogo:', error.message);

        // Si hay caché antiguo, usarlo como fallback
        if (catalogCache) {
            console.log('⚠️ Usando catálogo antiguo como fallback');
            return catalogCache.data;
        }

        return [];
    }
}

/**
 * Busca productos en el catálogo por término de búsqueda
 * Retorna máximo 3 productos
 */
export async function searchProducts(searchTerm: string, maxResults: number = 3): Promise<Product[]> {
    const catalog = await getCatalog();

    if (catalog.length === 0) {
        return [];
    }

    const term = searchTerm.toLowerCase().trim();

    // Buscar productos que coincidan con el término
    const matches = catalog.filter(product => {
        const description = product.des_item.toLowerCase();
        const code = product.cod_item.toLowerCase();

        return description.includes(term) || code.includes(term);
    });

    // Agrupar por cod_item y sumar existencias
    const grouped = new Map<string, Product>();

    for (const product of matches) {
        const key = product.cod_item;

        if (grouped.has(key)) {
            const existing = grouped.get(key)!;
            existing.existencia += product.existencia;
        } else {
            grouped.set(key, { ...product });
        }
    }

    // Convertir a array y ordenar por existencia
    const results = Array.from(grouped.values())
        .sort((a, b) => b.existencia - a.existencia)
        .slice(0, maxResults);

    return results;
}

/**
 * Obtiene productos aleatorios del catálogo
 * Útil para mostrar opciones cuando no hay búsqueda específica
 */
export async function getRandomProducts(count: number = 3): Promise<Product[]> {
    const catalog = await getCatalog();

    if (catalog.length === 0) {
        return [];
    }

    // Agrupar por cod_item
    const grouped = new Map<string, Product>();

    for (const product of catalog) {
        const key = product.cod_item;

        if (grouped.has(key)) {
            const existing = grouped.get(key)!;
            existing.existencia += product.existencia;
        } else {
            grouped.set(key, { ...product });
        }
    }

    const uniqueProducts = Array.from(grouped.values());

    // Seleccionar productos aleatorios
    const shuffled = uniqueProducts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Formatea un producto para mostrar al usuario
 */
export function formatProduct(product: Product): string {
    const price = product.precio_final.toLocaleString('es-CO');
    return `🏍️ ${product.des_item}\n💰 Precio: $${price}\n📦 Disponibles: ${product.existencia} unidades`;
}

/**
 * Formatea múltiples productos para mostrar al usuario
 */
export function formatProducts(products: Product[]): string {
    if (products.length === 0) {
        return 'No encontré productos que coincidan con tu búsqueda.';
    }

    const formatted = products.map(formatProduct).join('\n\n');
    return formatted;
}
