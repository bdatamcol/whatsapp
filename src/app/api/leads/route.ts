import { NextResponse } from 'next/server';


export async function POST(request: Request) {

    const version = process.env.META_API_VERSION || 'v17.0';
    const { pageId, pageAccessToken, formId } = await request.json();
    const baseUrl = 'https://graph.facebook.com';

    if( !pageId || !pageAccessToken || formId ) return NextResponse.json({ message: 'No params' });
    
    try {
        //https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?fields=name,id&access_token=${pageAccessToken}
        const leads = await fetch(`${baseUrl}/${version}/${pageId}/leadgen_forms?fields=name,id&access_token=${pageAccessToken}`);
        const { ...data } = await leads.json();
        

        if( formId ) {
            const leadsForms = await fetch(`${baseUrl}/${pageId}/${formId}&access_token=${pageAccessToken}`);
            console.log({ leadsForms });
        }


        return NextResponse.json({
            ...data
        });
        
    } catch (error) {
        NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 })
    }


}