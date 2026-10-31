import React from 'react'
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MetricCardProps {
  title: string
  value: string
  subvalue?: string
  changePercent?: number
  trendDirection?: 'up' | 'down' | 'neutral'
  isPositive?: boolean // Whether 'up' is good (e.g. for expenses, up is bad)
  periodLabel?: string
  tooltip?: string
  icon?: React.ReactNode
  sparklineData?: number[]
  sparklineColor?: string
  badgeText?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subvalue,
  changePercent,
  trendDirection = 'up',
  isPositive = true,
  periodLabel = 'vs last period',
  tooltip,
  icon,
  sparklineData,
  sparklineColor = '#3b82f6',
  badgeText,
}) => {
  const chartData = sparklineData ? sparklineData.map((val, idx) => ({ i: idx, v: val })) : null

  // Determine trend badge color
  const isGood = isPositive ? trendDirection === 'up' : trendDirection === 'down'
  const badgeClasses = isGood
    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50'
    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50'

  // Dynamic adaptive font scaling for large currency and count values
  const getValueFontSize = (len: number) => {
    if (len >= 15) return 'text-sm sm:text-base'
    if (len >= 13) return 'text-base sm:text-[17px]'
    if (len >= 11) return 'text-lg sm:text-[19px]'
    if (len >= 9) return 'text-xl sm:text-[21px]'
    return 'text-2xl'
  }

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all duration-200 group overflow-visible flex flex-col justify-between">
      {/* Top Row: Title + Icon/Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </span>
          {tooltip && (
            <div className="group/tip relative flex items-center shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:flex flex-col items-center z-50 pointer-events-none">
                <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xs text-white text-[11px] font-normal leading-relaxed rounded-xl px-3 py-2 shadow-2xl border border-slate-700/80 w-max max-w-[240px] text-center whitespace-normal">
                  {tooltip}
                </div>
                <div className="w-2 h-2 bg-slate-900/95 dark:bg-slate-800/95 rotate-45 -mt-1 border-r border-b border-slate-700/80" />
              </div>
            </div>
          )}
        </div>

        {icon && (
          <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between gap-2 my-1 min-w-0">
        <div
          className={`font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans truncate ${getValueFontSize(value.length)}`}
          title={value}
        >
          {value}
        </div>
        
        {badgeText && (
          <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {badgeText}
          </span>
        )}
      </div>

      {/* Bottom Row: Percentage change & Sparkline */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-50 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          {changePercent !== undefined && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold text-[11px] border ${badgeClasses}`}>
              {trendDirection === 'up' ? (
                <TrendingUp className="w-3 h-3 shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 shrink-0" />
              )}
              {trendDirection === 'up' ? '+' : '-'}{Math.abs(changePercent)}%
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500 font-normal">{periodLabel}</span>
        </div>

        {/* Optional mini sparkline */}
        {chartData && (
          <div className="w-16 h-7">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={sparklineColor}
                  strokeWidth={1.75}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {subvalue && (
        <div className="mt-1 text-[11px] text-slate-400">
          {subvalue}
        </div>
      )}
    </div>
  )
}
