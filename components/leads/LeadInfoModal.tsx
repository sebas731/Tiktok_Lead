'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
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

function Titulo({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-sm font-semibold text-text">{children}</h3>
}

/** Ventana informativa para el asesor: estados de los leads, reglas y qué puede hacer. */
export function LeadInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} size="xl" title="Estados de los leads y reglas" actions={<Button onClick={onClose}>Entendido</Button>}>
      <div className="flex flex-col gap-6">
        <section>
          <Titulo>Estados de un lead</Titulo>
          <ul className="flex flex-col gap-2.5">
            <Estado status="SIN_GESTION">Lead nuevo, aún sin atender.</Estado>
            <Estado status="NO_CONTACTO">No contestó o celular apagado. Vuelve al pool con 5 h de enfriamiento.</Estado>
            <Estado status="AGENDADO">Quedó en llamar más tarde. Se reserva para ti 24 h; luego vuelve al pool.</Estado>
            <Estado status="POSITIVO">Venta cerrada. Es un estado final (queda en tu historial).</Estado>
            <Estado status="NEGATIVO">No califica / no interesa. Estado final (historial).</Estado>
          </ul>
        </section>

        <section>
          <Titulo>Reglas que aplicamos</Titulo>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-text-muted">
            <li>Al pulsar <b>«Asignarme un lead»</b> se te prioriza un lead <b>SIN GESTIÓN</b> (nuevo); si no hay, te damos otro disponible.</li>
            <li>Solo puedes tener <b>un lead sin gestionar a la vez</b>: termínalo antes de tomar otro.</li>
            <li>Un <b>AGENDADO</b> se reserva 24 h para ti; pasado ese tiempo vuelve al pool para cualquiera.</li>
            <li>Un <b>NO_CONTACTO</b> vuelve al pool con 5 h de enfriamiento y <b>no</b> se te devuelve a ti de inmediato.</li>
            <li>Los estados <b>POSITIVO</b> y <b>NEGATIVO</b> son finales (quedan en el historial).</li>
            <li>Los <b>domingos</b> no cuentan para la racha diaria (no se trabaja).</li>
          </ul>
        </section>

        <section>
          <Titulo>Qué puedes hacer</Titulo>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-text-muted">
            <li><b>Asignarte un lead</b> (en campañas automáticas) con el botón «Asignarme un lead».</li>
            <li><b>Gestionarlo</b>: cambiar estado, sub-estado y observaciones desde su ventana.</li>
            <li><b>Escribir por WhatsApp</b> con el saludo ya listo.</li>
            <li><b>Soltar</b> un lead que no contesta: vuelve al pool para que otro lo tome.</li>
            <li><b>Recuperar</b> tus últimos 5 leads gestionados desde la pestaña «Historial».</li>
            <li>Ver tus <b>rachas</b> en «Mi perfil».</li>
          </ul>
        </section>
      </div>
    </Modal>
  )
}
