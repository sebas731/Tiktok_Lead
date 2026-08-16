// Helpers de teléfono/WhatsApp. Puros y client-safe (no importan Prisma).

/** Solo los dígitos del número, "pegados" (ej. "934468388") — como los usa la app de llamadas. */
export function toDigits(num: string): string {
  return num.replace(/\D/g, '')
}

/** Número en formato internacional para WhatsApp (Perú: antepone 51 a los de 9 dígitos). */
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
  return `Hola👋, un gusto saludarte, 😀 Soy ${asesorName}👨🏻‍💻de CLARO HOGAR, para una gestión mas ágil te llamaré al ${leadNumber} 📱`
}
