import React, { useState } from 'react'
import { api } from '@/lib/api'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowRight,
  Download,
  RefreshCw,
  Layers,
} from 'lucide-react'

interface FilePreview {
  file_name: string
  detected_type: string
  is_valid: boolean
  total_rows: number
  columns: string[]
  issues: string[]
  preview_rows: Record<string, any>[]
}

interface MultiFileImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess?: () => void
}

export const MultiFileImportModal: React.FC<MultiFileImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitSummary, setCommitSummary] = useState<Record<string, any> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files)
      setSelectedFiles(filesArr)
      setPreviews([])
      setCommitSummary(null)
      setErrorMessage(null)
    }
  }

  const handleValidate = async () => {
    if (selectedFiles.length === 0) return
    setIsValidating(true)
    setErrorMessage(null)

    const formData = new FormData()
    selectedFiles.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const res = await api.post('/imports/preview/', formData)
      setPreviews(res.files || [])
    } catch (err: any) {
      setErrorMessage(err?.error || err?.detail || 'Validation failed. Please verify file formats.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleCommit = async () => {
    if (selectedFiles.length === 0) return
    setIsCommitting(true)
    setErrorMessage(null)

    const formData = new FormData()
    selectedFiles.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const res = await api.post('/imports/commit/', formData)
      setCommitSummary(res.batch_results || {})
      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (err: any) {
      setErrorMessage(err?.error || err?.detail || 'Import failed. Check logs.')
    } finally {
      setIsCommitting(false)
    }
  }

  const handleDownloadTemplate = (type: string) => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/imports/templates/${type}/`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Multi-File CSV & Excel Data Importer
              </h3>
              <p className="text-xs text-slate-500">
                Upload sales, inventory, purchases, expenses, or suppliers in a single batch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Template Downloads Banner */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Download Standard CSV Templates
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['suppliers', 'inventory', 'purchases', 'sales', 'expenses'].map((dtype) => (
              <button
                key={dtype}
                type="button"
                onClick={() => handleDownloadTemplate(dtype)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="capitalize">{dtype}.csv</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* File Drop Area */}
        {!commitSummary && (
          <div className="mt-4">
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 text-slate-400" />
              <span className="mt-2 text-sm font-semibold text-slate-700">
                Click to browse or drag & drop CSV or Excel files
              </span>
              <span className="text-xs text-slate-500">
                Supports multiple files: sales.csv, inventory.csv, purchases.csv, expenses.csv, suppliers.csv
              </span>
              <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {selectedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedFiles.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {f.name} ({(f.size / 1024).toFixed(1)} KB)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Validation Previews */}
        {previews.length > 0 && !commitSummary && (
          <div className="mt-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Batch Validation Summary ({previews.length} Files Detected)
            </h4>
            <div className="space-y-3">
              {previews.map((prev, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">
                        {prev.file_name}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                        {prev.detected_type}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({prev.total_rows} rows)
                      </span>
                    </div>
                    {prev.is_valid ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle className="h-4 w-4" /> Valid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                        <AlertTriangle className="h-4 w-4" /> Has Issues
                      </span>
                    )}
                  </div>

                  {/* Issues */}
                  {prev.issues.length > 0 && (
                    <div className="mt-2 space-y-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                      {prev.issues.map((iss, i) => (
                        <div key={i}>• {iss}</div>
                      ))}
                    </div>
                  )}

                  {/* Preview Table */}
                  {prev.preview_rows.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50 text-[10px] font-semibold uppercase text-slate-500">
                          <tr>
                            {prev.columns.slice(0, 6).map((col, cIdx) => (
                              <th key={cIdx} className="px-2 py-1">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {prev.preview_rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {prev.columns.slice(0, 6).map((col, cIdx) => (
                                <td key={cIdx} className="px-2 py-1 truncate max-w-[120px]">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Batch Results */}
        {commitSummary && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Batch Ingestion Completed Successfully!
              </div>
              <p className="mt-1 text-xs text-emerald-700">
                All records have been committed to PostgreSQL in dependency order. Real analytics are refreshed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(commitSummary).map(([dType, res]: [string, any]) => (
                <div
                  key={dType}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-xs"
                >
                  <div className="font-bold uppercase text-slate-800 flex items-center justify-between">
                    <span>{dType}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {res.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-slate-500 text-[11px]">
                    <div>Imported: <strong className="text-emerald-600">{res.imported_rows}</strong></div>
                    <div>Skipped: <strong className="text-amber-600">{res.skipped_rows}</strong></div>
                    <div>Failed: <strong className="text-rose-600">{res.failed_rows}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {commitSummary ? 'Close' : 'Cancel'}
          </button>

          {!commitSummary && previews.length === 0 && (
            <button
              type="button"
              disabled={selectedFiles.length === 0 || isValidating}
              onClick={handleValidate}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Validating Files...
                </>
              ) : (
                <>
                  <span>Validate & Preview</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}

          {!commitSummary && previews.length > 0 && (
            <button
              type="button"
              disabled={isCommitting}
              onClick={handleCommit}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Ingesting Records to PostgreSQL...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Confirm & Commit Batch</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
