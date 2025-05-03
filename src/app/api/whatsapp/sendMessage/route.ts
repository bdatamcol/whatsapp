// src/app/api/whatsapp/send/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { phone, message } = await request.json();

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone, // Número destino (ej: "+51987654321")
        type: "text",
        text: { body: message },
      }),
    }
  );

  const data = await response.json();
  return NextResponse.json(data);
}