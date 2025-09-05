import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error("Supabase URL o Service Key no configurados.");
    return createClient(url, serviceKey);
}

export async function GET() {
    try {
        const supabase = getSupabaseServer();
        const { data, error } = await supabase
            .from("companies")
            .select("id,name,waba_id,phone_number_id")
            .order("name", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ ok: true, data });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message || "Error" }, { status: 500 });
    }
}