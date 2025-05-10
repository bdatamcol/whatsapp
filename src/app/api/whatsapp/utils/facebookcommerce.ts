// src/utils/facebookCommerce.ts

export const subirProductoAFacebook = async (producto: any) => {
    const CATALOG_ID = process.env.FB_CATALOG_ID!;
    const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN!;
  
    const res = await fetch(`https://graph.facebook.com/v19.0/${CATALOG_ID}/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(producto),
    });
  
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Error: ${JSON.stringify(data)}`);
    }
    return data;
  };
  