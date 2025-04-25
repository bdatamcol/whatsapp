import { NextRequest, NextResponse } from 'next/server';
import { obtenerFormulariosDePagina, obtenerLeadsDeFormulario } from '@/app/utils/facebookLeads';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pageId, formId } = body;

  try {
    if (formId) {
      const leads = await obtenerLeadsDeFormulario(formId);
      return NextResponse.json({ ok: true, leads });
    } else if (pageId) {
      const forms = await obtenerFormulariosDePagina(pageId);
      return NextResponse.json({ ok: true, forms });
    } else {
      return NextResponse.json({ ok: false, error: 'Debes enviar pageId o formId' });
    }
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message });
  }
}
