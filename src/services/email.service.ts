import { env } from '../config/env';
import logger from '../utils/logger';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Envío de correo transaccional.
 *
 * Fase 1: no existe un proveedor SMTP configurado (sin dependencias nuevas).
 * - En desarrollo/test se registra el mensaje (y el enlace) en los logs del backend
 *   para poder seguir probando el flujo de restablecimiento.
 * - En producción se emite una advertencia de que el transporte aún no está
 *   configurado; el envío real se conectará en la Fase 4 (módulo de notificaciones).
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (env.isProduction) {
    logger.warn(
      `[email] Transporte de correo aún no configurado. No se envió el mensaje a "${message.to}" (asunto: "${message.subject}")`,
    );
    return;
  }
  logger.warn(
    `[email][dev] Mensaje dirigido a "${message.to}" (asunto: "${message.subject}")\n${message.text}`,
  );
}

export function buildPasswordResetEmail(to: string, resetLink: string): EmailMessage {
  return {
    to,
    subject: 'Restablece tu contraseña',
    text:
      `Recibimos una solicitud para restablecer la contraseña de tu cuenta.\n\n` +
      `Abre el siguiente enlace para elegir una nueva contraseña:\n${resetLink}\n\n` +
      `Si no solicitaste este cambio, ignora este mensaje.`,
  };
}
