import { normalizeText } from './textUtils';

export function findCityIdInText(text: string, cities: { id: number, name: string, region_id: number }[]): number | null {
    const normalizedText = normalizeText(text);

    for (const city of cities) {
        const normalizedCityName = normalizeText(city.name);

        // Usamos palabra completa para evitar falsos positivos
        const regex = new RegExp(`\\b${normalizedCityName}\\b`, 'i');
        if (regex.test(normalizedText)) {
            return city.id;
        }
    }

    return null; // No encontró coincidencia
}

