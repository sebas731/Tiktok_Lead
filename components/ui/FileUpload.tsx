'use client'

import { useRef } from 'react'

type FileUploadProps = {
  label: string
  value?: string | null
  onChange: (dataUrl: string, fileName: string) => void
  accept?: string
  disabled?: boolean
}

/**
 * Sube un archivo y lo entrega como data URL (base64) a `onChange`.
 * Suficiente para logos/imágenes pequeñas sin backend de almacenamiento.
 */
export function FileUpload({ label, value, onChange, accept = 'image/*', disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result), file.name)
    reader.readAsDataURL(file)
  }

  const isImage = value && value.startsWith('data:image')

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text hover:bg-bg disabled:text-text-muted"
        >
          Elegir archivo
        </button>
        {isImage && <img src={value} alt="preview" className="h-10 w-10 rounded object-cover" />}
        {value && !isImage && <span className="text-xs text-text-muted">Archivo cargado</span>}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  )
}
