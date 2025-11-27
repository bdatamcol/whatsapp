/**
 * Calcula la cuota mensual de un crédito con los parámetros fijos de Japolandia
 * 
 * Esta función replica exactamente la lógica del script Python original
 * para garantizar precisión en los cálculos de financiación.
 * 
 * @param precioProducto - Precio total del producto en pesos
 * @param plazoMeses - Plazo de financiación en meses (6, 12, 18, 24, 36, 48)
 * @param cuotaInicial - Cuota inicial en pesos (opcional, default: 0)
 * @returns Cuota mensual redondeada a pesos
 * 
 * @example
 * ```typescript
 * const cuota = calcularCuota(9449000, 12);
 * console.log(cuota); // Retorna la cuota mensual
 * ```
 */
export function calcularCuota(
    precioProducto: number,
    plazoMeses: number,
    cuotaInicial: number = 0
): number {
    // Validaciones de entrada
    if (precioProducto <= 0) {
        throw new Error('El precio del producto debe ser mayor a 0');
    }
    if (plazoMeses <= 0 || !Number.isInteger(plazoMeses)) {
        throw new Error('El plazo debe ser un número entero positivo');
    }
    if (cuotaInicial < 0) {
        throw new Error('La cuota inicial no puede ser negativa');
    }
    if (cuotaInicial >= precioProducto) {
        throw new Error('La cuota inicial debe ser menor al precio del producto');
    }

    // Parámetros fijos
    const interesMensual = 0.018;      // 1.8% mensual
    const sgvdPorcentaje = 0.01;       // 1%
    const garantiaPorcentaje = 0.10;   // 10%
    const iva = 0.19;                  // 19%

    // Monto financiado
    const montoFinanciado = precioProducto - cuotaInicial;

    // SGVD total - calculado sobre el monto financiado
    const sgvdTotal = montoFinanciado * sgvdPorcentaje;

    // Garantía total y mensual - calculado sobre el monto financiado
    const garantiaTotal = montoFinanciado * garantiaPorcentaje;
    const garantiaMensual = garantiaTotal / plazoMeses;

    // IVA sobre garantía mensual
    const ivaGarantiaMensual = garantiaMensual * iva;

    // Cuota financiera (fórmula de anualidad)
    const cuotaFinanciera = (montoFinanciado * interesMensual) /
        (1 - Math.pow(1 + interesMensual, -plazoMeses));

    // SGVD mensual
    const sgvdMensual = sgvdTotal / plazoMeses;

    // Cuota mensual final
    const cuotaFinal = cuotaFinanciera + sgvdMensual + garantiaMensual + ivaGarantiaMensual;

    // Redondear a pesos (sin decimales)
    return Math.round(cuotaFinal);
}

/**
 * Calcula las cuotas para múltiples plazos
 * 
 * @param precioProducto - Precio total del producto en pesos
 * @param plazos - Array de plazos en meses
 * @param cuotaInicial - Cuota inicial en pesos (opcional, default: 0)
 * @returns Objeto con plazos como keys y cuotas como values
 * 
 * @example
 * ```typescript
 * const cuotas = calcularCuotasMultiples(9449000, [6, 12, 18, 24, 36, 48]);
 * console.log(cuotas);
 * // { 6: 1234567, 12: 678901, ... }
 * ```
 */
export function calcularCuotasMultiples(
    precioProducto: number,
    plazos: number[],
    cuotaInicial: number = 0
): Record<number, number> {
    const resultado: Record<number, number> = {};

    for (const plazo of plazos) {
        resultado[plazo] = calcularCuota(precioProducto, plazo, cuotaInicial);
    }

    return resultado;
}

/**
 * Formatea un número como pesos colombianos
 * 
 * @param valor - Valor numérico
 * @returns String formateado como "$1.234.567"
 */
export function formatearPesos(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
}
