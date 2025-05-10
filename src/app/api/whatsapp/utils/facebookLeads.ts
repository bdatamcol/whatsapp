export const obtenerFormulariosDePagina = async (pageId: string) => {
    const token = process.env.FACEBOOK_ACCESS_TOKEN!;
    const url = `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${token}`;

    
  
    const res = await fetch(url);
    const data = await res.json();
  
    if (!res.ok) throw new Error(data.error.message);
    return data.data;
  };
  
  interface FacebookForm {
    id: string;
    name: string;
    // otras propiedades
  }
  
  interface FacebookLead {
    created_time: string;
    field_data: Array<{
      name: string;
      values: string[];
    }>;
    // otras propiedades
  }
  

  export const obtenerLeadsDeFormulario = async (formId: string) => {
    const token = process.env.FACEBOOK_ACCESS_TOKEN!;
    const url = `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${token}`;
  
    const res = await fetch(url);
    const data = await res.json();
  
    if (!res.ok) throw new Error(data.error.message);
    return data.data;
  };
  