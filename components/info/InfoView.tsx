'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, leadStatusTone } from '@/components/ui/Badge'
import { STATUS_LABELS } from '@/lib/constants/leads'

function Estado({ status, children }: { status: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0">
        <Badge tone={leadStatusTone(status)}>{STATUS_LABELS[status] ?? status}</Badge>
      </span>
      <span className="text-sm text-text-muted">{children}</span>
    </li>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
      <h3 className="mb-3 text-sm font-semibold text-text">{title}</h3>
      {children}
    </section>
  )
}

/** Página de información: estados de los leads, reglas y qué puede hacer el asesor. */
export function InfoView() {
  return (
    <div>
      <PageHeader title="Información" description="Estados de los leads, reglas y qué puedes hacer." />

      <div className="flex flex-col gap-4">
        <Card title="Estados de un lead">
          <ul className="flex flex-col gap-2.5">
            <Estado status="SIN_GESTION">Lead nuevo, aún sin atender.</Estado>
            <Estado status="NO_CONTACTO">No contestó o celular apagado. Vuelve al pool con 5 h de enfriamiento.</Estado>
            <Estado status="AGENDADO">Quedó en llamar más tarde. Se reserva para ti 24 h; luego vuelve al pool.</Estado>
            <Estado status="POSITIVO">Venta cerrada. Es un estado final (queda en tu historial).</Estado>
            <Estado status="NEGATIVO">No califica / no interesa. Estado final (historial).</Estado>
          </ul>
        </Card>

        <Card title="Reglas que aplicamos">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-text-muted">
            <li>Al pulsar <b>«Asignarme un lead»</b> se te prioriza un lead <b>SIN GESTIÓN</b> (nuevo); si no hay, te damos otro disponible.</li>
            <li>Solo puedes tener <b>un lead sin gestionar a la vez</b>: termínalo antes de tomar otro.</li>
            <li>Un <b>AGENDADO</b> se reserva 24 h para ti; pasado ese tiempo vuelve al pool para cualquiera.</li>
            <li>Un <b>NO_CONTACTO</b> vuelve al pool con 5 h de enfriamiento y <b>no</b> se te devuelve a ti de inmediato.</li>
            <li>Los estados <b>POSITIVO</b> y <b>NEGATIVO</b> son finales (quedan en el historial).</li>
            <li>Los <b>domingos</b> no cuentan para la racha diaria (no se trabaja).</li>
          </ul>
        </Card>

        <Card title="Qué puedes hacer">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-text-muted">
            <li><b>Asignarte un lead</b> (en campañas automáticas) con el botón «Asignarme un lead».</li>
            <li><b>Gestionarlo</b>: cambiar estado, sub-estado y observaciones desde su ventana.</li>
            <li><b>Escribir por WhatsApp</b> con el saludo ya listo.</li>
            <li><b>Soltar</b> un lead que no contesta: vuelve al pool para que otro lo tome.</li>
            <li><b>Recuperar</b> tus últimos 5 leads gestionados desde la pestaña «Historial».</li>
            <li>Ver tus <b>rachas</b> en «Mi perfil».</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
