import { NextResponse } from "next/server";
import { syncRagFilesToVectorStore, getVectorStoreId } from "@/lib/ia/services/vector-store-service";

export async function POST() {
    try {
        console.log("[VectorStore Sync] Iniciando sync...");
        const vectorStoreId = await syncRagFilesToVectorStore();
        return NextResponse.json({
            success: true,
            vectorStoreId,
            message: `Archivos subidos al Vector Store: ${vectorStoreId}`,
        });
    } catch (error) {
        console.error("[VectorStore Sync] Error:", error);
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const vectorStoreId = await getVectorStoreId();
        if (!vectorStoreId) {
            return NextResponse.json({
                status: "not_found",
                message: "No hay Vector Store configurado. Ejecuta POST para crearlo.",
            });
        }
        return NextResponse.json({
            status: "ready",
            vectorStoreId,
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
