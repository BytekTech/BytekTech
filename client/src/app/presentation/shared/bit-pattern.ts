/**
 * Expande un texto a la secuencia de bits de sus códigos ASCII,
 * carácter por carácter (8 bits cada uno). Es la base del visual
 * generativo de cada proyecto: el nombre pintado en sus propios bytes.
 */
export function bitPattern(text: string): boolean[] {
  return Array.from(text).flatMap((char) => {
    const bits = char.charCodeAt(0).toString(2).padStart(8, '0');
    return Array.from(bits, (bit) => bit === '1');
  });
}
