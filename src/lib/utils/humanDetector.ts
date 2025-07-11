import { normalizeText } from './textUtils';

const humanPatterns: { pattern: RegExp; label: string }[] = [
    { pattern: /asesor/i, label: 'asesor' },
    { pattern: /humano/i, label: 'humano' },
    { pattern: /quiero (hablar|conversar) con (alguien|una persona)/i, label: 'quiero hablar con alguien' },
    { pattern: /persona real/i, label: 'persona real' },
    { pattern: /no quiero hablar con (un )?robot/i, label: 'no quiero robot' },
    { pattern: /me atienda (alguien|una persona)/i, label: 'me atienda una persona' },
    { pattern: /atención humana/i, label: 'atención humana' },
];

export function needsHumanAgent(input: string): { match: boolean; keyword?: string } {
    const normalized = normalizeText(input);
    for (const { pattern, label } of humanPatterns) {
        if (pattern.test(normalized)) {
            return { match: true, keyword: label };
        }
    }
    return { match: false };
}

