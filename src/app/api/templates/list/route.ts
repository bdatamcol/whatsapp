import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listTemplates } from "@/lib/whatsapp/templates/metaTemplatesApi";
import { decryptData as decryptDataShared } from '@/lib/security/crypto';

function getSupabaseServer() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error("Supabase URL o Service Key no configurados.");
    return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get("companyId");
        const limit = searchParams.get("limit");
        const after = searchParams.get("after");

        if (!companyId) {
            return NextResponse.json({ ok: false, error: "Falta companyId" }, { status: 400 });
        }

        const supabase = getSupabaseServer();
        const { data: company, error } = await supabase
            .from("companies")
            .select("id,name,waba_id,facebook_access_token,whatsapp_access_token")
            .eq("id", companyId)
            .maybeSingle();

        if (error) throw error;
        if (!company) {
            return NextResponse.json({ ok: false, error: "Empresa no encontrada" }, { status: 404 });
        }
        if (!company.waba_id) {
            return NextResponse.json({ ok: false, error: "La empresa no tiene waba_id configurado" }, { status: 400 });
        }

        const secretKey = process.env.ENCRYPTION_KEY;
        const rawWabaId = company?.waba_id ?? '';
        const rawToken = company?.facebook_access_token || company?.whatsapp_access_token || undefined;

        const wabaId = secretKey ? decryptDataShared(rawWabaId, secretKey) : rawWabaId;
        const tokenOverride = rawToken ? (secretKey ? decryptDataShared(rawToken, secretKey) : rawToken) : undefined;

        const data = await listTemplates(
            wabaId,
            limit ? Number(limit) : 50,
            after || undefined,
            tokenOverride
        );

        return NextResponse.json({ ok: true, data });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message || "Error" }, { status: 500 });
    }
}