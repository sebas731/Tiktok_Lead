'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiSend } from '@/lib/api/client'
import type { Campaign, SheetTab } from '@/lib/types'

type Mode = 'PUBLIC_CSV' | 'SERVICE_ACCOUNT'

type Props = {
  excelUrl: string
  setExcelUrl: (v: string) => void
  sheetAccessMode: Mode
  setSheetAccessMode: (v: Mode) => void
  excelGid: string
  setExcelGid: (v: string) => void
  excelSheetName: string
  setExcelSheetName: (v: string) => void
  autoSync: boolean
  setAutoSync: (v: boolean) => void
  campaign?: Campaign | null
  onSynced?: () => void
}

const MODE_OPTIONS = [
  { value: 'PUBLIC_CSV', label: 'Público (CSV export)' },
  { value: 'SERVICE_ACCOUNT', label: 'Privado (Service Account)' },
]

type SyncResult = { imported: number; total: number; renamed: { from: string; to: string } | null }

export function ExcelOriginFields({
  excelUrl, setExcelUrl,
  sheetAccessMode, setSheetAccessMode,
  excelGid, setExcelGid,
  excelSheetName, setExcelSheetName,
  autoSync, setAutoSync,
  campaign, onSynced,
}: Props) {
  const [tabs, setTabs] = useState<SheetTab[]>([])
  const [loadingTabs, setLoadingTabs] = useState(false)
  const [tabsError, setTabsError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  async function loadTabs() {
    setLoadingTabs(true)
    setTabsError('')
    try {
      const list = await apiSend<SheetTab[]>('/api/campaigns/sheets/list', 'POST', { url: excelUrl, mode: sheetAccessMode })
      setTabs(list)
    } catch (e) {
      setTabsError(e instanceof Error ? e.message : 'Error al cargar pestañas')
    } finally {
      setLoadingTabs(false)
    }
  }

  function selectTab(gid: string) {
    setExcelGid(gid)
    const t = tabs.find((x) => String(x.gid) === gid)
    if (t) setExcelSheetName(t.title)
  }

  async function syncNow() {
    if (!campaign) return
    setSyncing(true)
    setSyncMsg('')
    try {
      const r = await apiSend<SyncResult>(`/api/campaigns/${campaign.campaign_id}/sync`, 'POST')
      setSyncMsg(
        `${r.imported} nuevo(s) de ${r.total}.` +
          (r.renamed ? ` Pestaña renombrada: "${r.renamed.from}" → "${r.renamed.to}".` : ''),
      )
      onSynced?.()
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  // Opciones del select: las pestañas cargadas, o la ya guardada si aún no se recargaron.
  const tabOptions =
    tabs.length > 0
      ? tabs.map((t) => ({ value: String(t.gid), label: `${t.title} (gid ${t.gid})` }))
      : excelGid
        ? [{ value: excelGid, label: `${excelSheetName || 'pestaña'} (gid ${excelGid})` }]
        : []

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="URL del Google Sheet"
        value={excelUrl}
        onChange={setExcelUrl}
        placeholder="https://docs.google.com/spreadsheets/d/..."
      />
      <Select
        label="Modo de acceso"
        value={sheetAccessMode}
        onChange={(v) => setSheetAccessMode(v as Mode)}
        options={MODE_OPTIONS}
      />

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Select
            label="Pestaña (hoja) = campaña"
            value={excelGid}
            onChange={selectTab}
            placeholder={tabOptions.length ? 'Selecciona una pestaña' : 'Carga las pestañas primero'}
            options={tabOptions}
          />
        </div>
        <Button variant="secondary" onClick={loadTabs} loading={loadingTabs} disabled={!excelUrl}>
          Cargar pestañas
        </Button>
      </div>
      {tabsError && <p className="text-sm text-red-600">{tabsError}</p>}
      {excelGid && (
        <p className="text-xs text-text-muted">
          Seleccionada: <span className="font-medium text-text">{excelSheetName || '(sin nombre)'}</span> · gid {excelGid}
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-text">
        <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} />
        Incluir en la sincronización programada (automática)
      </label>

      {/* Detalle y estado de sincronización (solo en edición) */}
      {campaign && (
        <div className="rounded-xl border border-border bg-bg/50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-text">Sincronización</span>
            <Button variant="secondary" onClick={syncNow} loading={syncing} disabled={!excelGid}>
              Sincronizar ahora
            </Button>
          </div>
          <p className="mt-2 text-text-muted">
            Última: {campaign.lastSyncAt ? new Date(campaign.lastSyncAt).toLocaleString() : 'nunca'}
          </p>
          {campaign.lastSyncStatus === 'ERROR' ? (
            <p className="mt-1 text-red-600">Error: {campaign.lastSyncError}</p>
          ) : campaign.lastSyncStatus === 'OK' ? (
            <p className="mt-1 text-emerald-700">Última sincronización correcta.</p>
          ) : null}
          {syncMsg && <p className="mt-1 text-text">{syncMsg}</p>}
        </div>
      )}
    </div>
  )
}
