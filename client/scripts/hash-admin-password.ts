import { hashPassword } from '../src/server/admin/session';

/**
 * Genera el valor de ADMIN_PASSWORD_HASH a partir de una clave.
 *
 *   bun run admin:hash "la-clave-elegida"
 *
 * La clave en claro no se guarda en ningún lado: lo que va al entorno del
 * servidor es este hash, que no sirve para volver atrás.
 */
/**
 * El panel tiene una sola clave y nada más la protege: con menos de esto, una
 * fuerza bruta paciente deja de ser impensable.
 */
const MIN_PASSWORD_LENGTH = 14;

const password = process.argv[2];

if (!password) {
  console.error('Uso: bun run admin:hash "<clave>"');
  process.exit(1);
}

if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`La clave tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  process.exit(1);
}

console.log(hashPassword(password));
