import { hashPassword } from '../src/server/admin/session';

/**
 * Genera el valor de ADMIN_PASSWORD_HASH a partir de una clave.
 *
 *   bun run admin:hash "la-clave-elegida"
 *
 * La clave en claro no se guarda en ningún lado: lo que va al entorno del
 * servidor es este hash, que no sirve para volver atrás.
 */
const password = process.argv[2];

if (!password) {
  console.error('Uso: bun run admin:hash "<clave>"');
  process.exit(1);
}

console.log(hashPassword(password));
