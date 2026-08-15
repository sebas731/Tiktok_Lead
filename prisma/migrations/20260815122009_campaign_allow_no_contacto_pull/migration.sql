-- Habilita entregar leads NO_CONTACTO en autoservicio (ignora enfriamiento de 5h)
ALTER TABLE "Campaign" ADD COLUMN "allowNoContactoPull" BOOLEAN NOT NULL DEFAULT false;
