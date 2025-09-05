/* Servicio: Meta Templates API (WABA)
   Funciones: listar plantillas, crear plantillas
   Seguridad: usa token de System User o tokenOverride por empresa (server-side)
*/

export type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";
export type ParameterFormat = "POSITIONAL" | "NAMED";

export interface CreateTemplateBodyComponent {
  type: "BODY";
  text: string;
}

export interface CreateTemplatePayload {
  name: string;
  category: TemplateCategory;
  language: string;
  parameter_format?: ParameterFormat;
  components: CreateTemplateBodyComponent[];
}

export interface TemplateItem {
  id?: string;
  name: string;
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED";
  category?: TemplateCategory;
  quality_score?: unknown;
}

export interface ListTemplatesResponse {
  data: TemplateItem[];
  paging?: {
    next?: string;
    previous?: string;
  };
}

function getConfig(tokenOverride?: string) {
  const apiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";
  const fallback = process.env.META_SYSTEM_USER_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
  const token = tokenOverride || fallback;
  if (!token) {
    throw new Error("No se encontró token de Meta (META_SYSTEM_USER_TOKEN o FACEBOOK_ACCESS_TOKEN).");
  }
  const baseUrl = `https://graph.facebook.com/${apiVersion}`;
  return { baseUrl, token };
}

export async function listTemplates(wabaId: string, limit = 50, after?: string, tokenOverride?: string) {
  const { baseUrl, token } = getConfig(tokenOverride);
  const params = new URLSearchParams({ access_token: token, limit: String(limit) });
  if (after) params.set("after", after);
  const url = `${baseUrl}/${wabaId}/message_templates?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Error listTemplates: ${res.status} ${res.statusText} - ${JSON.stringify(json)}`);
  }
  return json as ListTemplatesResponse;
}

export async function createTemplate(wabaId: string, payload: CreateTemplatePayload, tokenOverride?: string) {
  const { baseUrl, token } = getConfig(tokenOverride);
  const body = {
    name: payload.name,
    category: payload.category,
    language: payload.language,
    parameter_format: payload.parameter_format || "POSITIONAL",
    components: payload.components,
  };

  const url = `${baseUrl}/${wabaId}/message_templates`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Error createTemplate: ${res.status} ${res.statusText} - ${JSON.stringify(json)}`);
  }
  return json;
}