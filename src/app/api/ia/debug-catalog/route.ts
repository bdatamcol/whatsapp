import { NextResponse } from "next/server";
import { getMotoPriceList, searchPrices } from "@/lib/ia/services/price-list-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || undefined;

    try {
        const list = await getMotoPriceList();

        const scooter = list.filter((p) => p.categoria === "scooter" && p.precioBase > 0);
        const sport = list.filter((p) => p.categoria === "sport" && p.precioBase > 0);
        const trabajo = list.filter((p) => p.categoria === "trabajo" && p.precioBase > 0);
        const enduro = list.filter((p) => p.categoria === "enduro" && p.precioBase > 0);

        let filtered: typeof list = [];
        if (query) {
            filtered = await searchPrices(query, category ? { category: category as any } : undefined);
        }

        return NextResponse.json({
            cache: {
                total_items: list.length,
                with_price: list.filter((p) => p.precioBase > 0).length,
            },
            by_category: {
                scooter: scooter.map((p) => ({ ref: p.referencia, price: p.precioBase, categoria: p.categoria })),
                sport: sport.map((p) => ({ ref: p.referencia, price: p.precioBase, categoria: p.categoria })),
                trabajo: trabajo.map((p) => ({ ref: p.referencia, price: p.precioBase, categoria: p.categoria })),
                enduro: enduro.map((p) => ({ ref: p.referencia, price: p.precioBase, categoria: p.categoria })),
            },
            filtered: filtered.map((p) => ({
                ref: p.referencia,
                price: p.precioBase,
                categoria: p.categoria,
                bono: p.bonoDescuento,
            })),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}
