-- Reserva/enfriamiento de leads (anti-bucle AGENDADO/NO_CONTACTO).
ALTER TABLE "Lead" ADD COLUMN "reservedUntil" TIMESTAMP(3);
