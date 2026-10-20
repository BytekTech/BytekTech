import type { NextFunction, Request, Response } from 'express';

/** IP del cliente detrás del proxy de Vercel, con la conexión directa como respaldo. */
export function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Express 4 no espera promesas: un rechazo sin atrapar nunca llegaría al manejador de errores. */
export function forwardErrors(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
