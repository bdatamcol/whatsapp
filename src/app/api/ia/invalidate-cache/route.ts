import { NextResponse } from "next/server";
import { getMotoPriceList } from "@/lib/ia/services/price-list-service";
import { getMotoCatalog } from "@/lib/ia/services/vehicle-catalog-service";

export async function POST() {
    try {
        await getMotoCatalog();
        await getMotoPriceList();
        return NextResponse.json({ success: true, message: "Cache invalidado y catálogo recargado" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const list = await getMotoPriceList();
        const byCategory: Record<string, number> = {};
        for (const p of list) {
            if (!byCategory[p.categoria]) byCategory[p.categoria] = 0;
            if (p.precioBase > 0) byCategory[p.categoria]++;
        }
        return NextResponse.json({
            total: list.length,
            con_precio: list.filter((p) => p.precioBase > 0).length,
            por_categoria: byCategory,
            sample_scooter: list.filter((p) => p.categoria === "scooter" && p.precioBase > 0).slice(0, 5).map((p) => ({ ref: p.referencia, price: p.precioBase })),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}
