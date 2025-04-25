export const obtenerFormulariosDePagina = async (pageId: string) => {
    const token = process.env.FACEBOOK_ACCESS_TOKEN!;
    const url = `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${token}`;
  
    const res = await fetch(url);
    const data = await res.json();
  
    if (!res.ok) throw new Error(data.error.message);
    return data.data;
  };
  
  export const obtenerLeadsDeFormulario = async (formId: string) => {
    const token = process.env.FACEBOOK_ACCESS_TOKEN!;
    const url = `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${token}`;
  
    const res = await fetch(url);
    const data = await res.json();
  
    if (!res.ok) throw new Error(data.error.message);
    return data.data;
  };
  