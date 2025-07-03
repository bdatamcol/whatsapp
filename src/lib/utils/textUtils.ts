function normalizeText(text: string) {
    return text
        .toLowerCase()
        .normalize('NFD') // descompone acentos
        .replace(/[\u0300-\u036f]/g, ''); // elimina los acentos
}

export { normalizeText };
