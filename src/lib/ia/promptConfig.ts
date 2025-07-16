const PROMPTS: Record<string, string> = {
    bdatam: `Actúa como BDIASERVICE, el asistente virtual oficial de BDATAM, una agencia de marketing digital ubicada en Cúcuta, Norte de Santander, especializada...`,
    japolandia: `Eres el asistente oficial de Japolandia Móvil, una empresa de tecnología y comunicación...`,
    orpa: `Representas a ORPA, una marca enfocada en bienestar, salud y desarrollo personal...`,
    default: `Eres un asistente virtual útil, claro, profesional y cordial. Responde a preguntas y guía a los usuarios.`
};

export async function getPromptByEmpresaId(empresaId: string): Promise<string> {
    return PROMPTS[empresaId] || PROMPTS.default;
}
