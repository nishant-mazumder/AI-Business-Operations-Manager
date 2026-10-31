import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Package,
  Receipt,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Info,
  Filter,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Recommendation } from '@/types'

export const Recommendations: React.FC = () => {
  const { recommendations, markRecommendationComplete, dismissRecommendation } = useApp()
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const navigate = useNavigate()

  // Filter recommendations
  const filteredRecs = recommendations.filter(r => {
    const matchesPriority = filterPriority === 'all' || r.priority === filterPriority
    const matchesCat = filterCategory === 'all' || r.relatedCategory === filterCategory
    return matchesPriority && matchesCat
  })

  const activeCount = recommendations.filter(r => r.status === 'active').length
  const completedCount = recommendations.filter(r => r.status === 'completed').length
  const criticalCount = recommendations.filter(r => r.status === 'active' && r.priority === 'critical').length

  const getPriorityVariant = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'critical':
        return 'danger'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'opportunity':
        return 'success'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Actionable Business Recommendations
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Operations Advice
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Prescriptive intelligence synthesized across current store demand, inventory safety buffers, and margin leaks.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 rounded-xl border border-blue-200/70 text-blue-900 text-xs font-medium">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Continuous telemetry evaluation active across supply chain signals</span>
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Action Items
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{activeCount} Pending</div>
            <div className="text-xs text-slate-500 mt-0.5">Prioritized by business impact</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Lightbulb className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Critical Urgency
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{criticalCount} Critical</div>
            <div className="text-xs text-rose-500 mt-0.5">Potential stockout / cost leak</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Resolved & Completed
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount} Executed</div>
            <div className="text-xs text-emerald-600 mt-0.5">Operations optimized</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter by Priority:
          </span>
          <div className="flex items-center gap-1 text-xs">
            {['all', 'critical', 'high', 'medium', 'opportunity'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                  filterPriority === p
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Domain:</span>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Domains</option>
            <option value="Office Furniture">Office Furniture</option>
            <option value="Hardware & Displays">Hardware & Displays</option>
            <option value="Power & Cables">Power & Cables</option>
            <option value="Logistics & Freight">Logistics & Freight</option>
            <option value="Consumables & Retail">Consumables & Retail</option>
          </select>
        </div>
      </div>

      {/* 4. Recommendation Cards List */}
      <div className="space-y-4">
        {filteredRecs.map(rec => {
          const isCompleted = rec.status === 'completed'
          const isDismissed = rec.status === 'dismissed'

          return (
            <div
              key={rec.id}
              className={`p-6 rounded-2xl border transition-all ${
                isCompleted
                  ? 'bg-emerald-50/30 border-emerald-200/60 opacity-80'
                  : isDismissed
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200/80 shadow-card hover:shadow-card-hover'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* Badge & Domain Header */}
                  <div className="flex items-center gap-2.5">
                    <StatusBadge
                      label={rec.priority.toUpperCase()}
                      variant={getPriorityVariant(rec.priority)}
                      size="sm"
                    />
                    <span className="text-xs font-semibold text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">{rec.relatedCategory}</span>
                    <span className="text-xs font-semibold text-slate-400">•</span>
                    <span className="text-xs text-slate-400">{rec.date}</span>
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Completed
                      </span>
                    )}
                    {isDismissed && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700">
                        Dismissed
                      </span>
                    )}
                  </div>

                  {/* Title & Explanation */}
                  <h3 className="text-base font-bold text-slate-900">{rec.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {rec.explanation}
                  </p>

                  {/* Suggested Action Box */}
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/70 text-xs text-blue-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Suggested Action:</strong> {rec.suggestedAction}
                    </div>
                  </div>
                </div>

                {/* Right Column: Metric Tag & Action Buttons */}
                <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {rec.metricLabel}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{rec.metric}</span>
                  </div>

                  {!isCompleted && !isDismissed && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dismissRecommendation(rec.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => markRecommendationComplete(rec.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition"
                      >
                        Mark Completed
                      </button>
                      {rec.targetRoute && (
                        <button
                          onClick={() => navigate(rec.targetRoute!)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1 shadow-xs"
                        >
                          Execute <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filteredRecs.length === 0 && (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-xs">
            {recommendations.length === 0
              ? 'No active operational recommendations. Upload your business datasets to evaluate inventory safety stock, replenishment schedules, and cost optimization opportunities.'
              : 'No recommendations currently matching the selected filter.'}
          </div>
        )}
      </div>
    </div>
  )
}
