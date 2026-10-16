/**
 * Reglas de forma del contenido editable.
 *
 * Viven en el dominio porque las necesitan los dos lados y por motivos
 * distintos: el servidor para aceptar o rechazar lo que llega —es la autoridad,
 * y lo que no pasa por acá no se guarda—, y el panel para poder señalar cuál es
 * el campo que falta, que es justo lo único que el rechazo no dice. Escritas
 * dos veces se habrían separado con el primer cambio.
 */

/** Identificador de una entrada: minúsculas, números y guiones. */
export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,59}$/;

/** El byte que dibuja la marca de un servicio. */
export const BITS_PATTERN = /^[01]{4,16}$/;

/**
 * Un color de marca termina escrito en una custom property de CSS: se aceptan
 * literales de color inertes y nada más, nunca una expresión capaz de arrastrar
 * otra declaración detrás.
 */
export const COLOR_PATTERN = /^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i;

/** Rango cerrado de un campo numérico. */
export interface Range {
  min: number;
  max: number;
}

/** Año desde el que un cliente es cliente. */
export const SINCE_RANGE: Range = { min: 1980, max: 2100 };

/** Posición de una etapa dentro del proceso. */
export const ORDER_RANGE: Range = { min: 1, max: 99 };

/** Valor de una métrica, antes del prefijo y el sufijo. */
export const METRIC_VALUE_RANGE: Range = { min: 0, max: 1000000 };

export function withinRange(value: number, range: Range): boolean {
  return value >= range.min && value <= range.max;
}
