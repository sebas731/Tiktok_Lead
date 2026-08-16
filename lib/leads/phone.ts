// Helpers de teléfono/WhatsApp. Puros y client-safe (no importan Prisma).

/** Solo los dígitos del número (ej. "51976752112"). */
export function toDigits(num: string): string {
  return num.replace(/\D/g, '')
}

/**
 * Número LOCAL "pegado" (9 dígitos, ej. "976752112") — como lo usa la app de
 * llamadas. Si viene con el prefijo de país 51 (11 dígitos), se lo quita.
 */
export function toLocalDigits(num: string): string {
  const d = toDigits(num)
  return d.length === 11 && d.startsWith('51') ? d.slice(2) : d
}

/** Número en formato internacional para WhatsApp (Perú: antepone 51 a los locales de 9 dígitos). */
function waPhone(num: string): string {
  const d = toDigits(num)
  return d.length === 9 ? `51${d}` : d
}

/** URL de chat de WhatsApp con el mensaje ya prellenado. */
export function waChatUrl(num: string, message: string): string {
  return `https://wa.me/${waPhone(num)}?text=${encodeURIComponent(message)}`
}

/** Saludo estándar de CLARO HOGAR para iniciar el chat con el lead. */
export function waGreeting(asesorName: string, leadNumber: string): string {
  return `Hola 👋, un gusto saludarte 😀. Soy ${asesorName} 💻 de CLARO HOGAR, para una gestión más ágil te llamaré al ${leadNumber} 📱`
}
