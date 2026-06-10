import { useState } from 'react'
import { formatCurrencyShort } from '../../lib/utils'
import type { TimeseriesPoint, TimeseriesGroupBy } from '../../types/reports'
import { formatCurrency } from '../../lib/utils'

interface TimeseriesChartProps {
  data:     TimeseriesPoint[]
  groupBy:  TimeseriesGroupBy
  loading?: boolean
}

// ── SVG layout ───────────────────────────────────────────────
const W    = 700
const H    = 240
const PAD  = { top: 16, right: 24, bottom: 44, left: 68 }
const IW   = W - PAD.left - PAD.right
const IH   = H - PAD.top  - PAD.bottom

function formatPeriodLabel(period: string, groupBy: TimeseriesGroupBy): string {
  const d = new Date(period + 'T00:00:00')
  if (groupBy === 'month') return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  const d: string[] = [`M ${pts[0].x} ${pts[0].y}`]
  for (let i = 1; i < pts.length; i++) {
    const cpX = (pts[i - 1].x + pts[i].x) / 2
    d.push(`C ${cpX} ${pts[i - 1].y}, ${cpX} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`)
  }
  return d.join(' ')
}

function smoothArea(pts: { x: number; y: number }[], baseY: number): string {
  if (pts.length === 0) return ''
  const line = smoothPath(pts)
  return `${line} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`
}

export function TimeseriesChart({ data, groupBy, loading }: TimeseriesChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="h-64 rounded-xl bg-stone-50 animate-pulse" />
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-stone-400">
        Nenhum dado no período selecionado.
      </div>
    )
  }

  // ── Y scale (supports negative balance) ──────────────────
  const allValues   = data.flatMap(d => [d.revenue, d.expense, d.balance])
  const rawMax      = Math.max(...allValues, 1)
  const rawMin      = Math.min(...allValues, 0)
  const yRange      = rawMax - rawMin || 1

  const scaleX = (i: number) =>
    PAD.left + (data.length === 1 ? IW / 2 : (i / (data.length - 1)) * IW)
  const scaleY = (v: number) =>
    PAD.top + IH - ((v - rawMin) / yRange) * IH
  const zeroY  = scaleY(0)

  // ── Paths ─────────────────────────────────────────────────
  const revPts  = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.revenue) }))
  const expPts  = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.expense) }))
  const balPts  = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.balance) }))

  // ── Y-axis ticks (5 levels) ───────────────────────────────
  const yTicks = Array.from({ length: 5 }, (_, i) => rawMin + (yRange / 4) * i)

  // ── X-axis labels (max 6 visible) ────────────────────────
  const maxLabels    = 6
  const step         = Math.max(1, Math.ceil(data.length / maxLabels))
  const xLabelIdxs   = data
    .map((_, i) => i)
    .filter(i => i % step === 0 || i === data.length - 1)

  // ── Hover handling ────────────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect      = e.currentTarget.getBoundingClientRect()
    const svgX      = ((e.clientX - rect.left) / rect.width) * W
    const relX      = svgX - PAD.left
    const fraction  = relX / IW
    const idx       = Math.round(fraction * (data.length - 1))
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const hoverPoint = hoverIdx !== null ? data[hoverIdx] : null
  const tooltipX   = hoverIdx !== null ? scaleX(hoverIdx) : 0
  const tooltipLeft = hoverIdx !== null && tooltipX / W > 0.65

  return (
    <div className="max-w-full space-y-3 overflow-x-hidden">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-emerald-500 rounded inline-block" />
          Receita
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-red-400 rounded inline-block" />
          Despesa
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-px bg-stone-400 rounded inline-block" style={{ borderTop: '2px dashed #a8a29e', height: 0 }} />
          Saldo
        </span>
      </div>

      {/* Chart */}
      <div className="relative max-w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full max-w-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={scaleY(tick)}
              y2={scaleY(tick)}
              stroke="#e7e5e4"
              strokeWidth={i === 0 ? 1 : 0.75}
              strokeDasharray={i === 0 ? undefined : '4 4'}
            />
          ))}

          {/* Zero line (only when balance is negative) */}
          {rawMin < 0 && (
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={zeroY}
              y2={zeroY}
              stroke="#d6d3d1"
              strokeWidth={1}
            />
          )}

          {/* Area fills */}
          <path
            d={smoothArea(revPts, zeroY)}
            fill="#10b981"
            fillOpacity={0.07}
          />
          <path
            d={smoothArea(expPts, zeroY)}
            fill="#f87171"
            fillOpacity={0.07}
          />

          {/* Lines */}
          <path
            d={smoothPath(revPts)}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={smoothPath(expPts)}
            fill="none"
            stroke="#f87171"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={smoothPath(balPts)}
            fill="none"
            stroke="#a8a29e"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots on data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={scaleX(i)} cy={scaleY(d.revenue)} r={data.length <= 12 ? 3 : 2} fill="#10b981" />
              <circle cx={scaleX(i)} cy={scaleY(d.expense)} r={data.length <= 12 ? 3 : 2} fill="#f87171" />
            </g>
          ))}

          {/* Hover vertical indicator */}
          {hoverIdx !== null && (
            <line
              x1={tooltipX}
              x2={tooltipX}
              y1={PAD.top}
              y2={PAD.top + IH}
              stroke="#78716c"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {/* Hover dot highlights */}
          {hoverIdx !== null && hoverPoint && (
            <>
              <circle cx={tooltipX} cy={scaleY(hoverPoint.revenue)} r={5} fill="#10b981" stroke="white" strokeWidth={2} />
              <circle cx={tooltipX} cy={scaleY(hoverPoint.expense)} r={5} fill="#f87171" stroke="white" strokeWidth={2} />
              <circle cx={tooltipX} cy={scaleY(hoverPoint.balance)} r={4} fill="#a8a29e" stroke="white" strokeWidth={2} />
            </>
          )}

          {/* Y-axis labels */}
          {yTicks.map((tick, i) => (
            <text
              key={i}
              x={PAD.left - 8}
              y={scaleY(tick) + 4}
              textAnchor="end"
              fontSize={10}
              fill="#78716c"
              fontFamily="ui-monospace, monospace"
            >
              {formatCurrencyShort(tick)}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabelIdxs.map(i => (
            <text
              key={i}
              x={scaleX(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#78716c"
            >
              {formatPeriodLabel(data[i].period, groupBy)}
            </text>
          ))}
        </svg>

        {/* Hover tooltip */}
        {hoverIdx !== null && hoverPoint && (
          <div
            className="absolute top-2 pointer-events-none bg-white border border-stone-200 rounded-xl shadow-lg p-3 text-xs z-10 min-w-[160px]"
            style={{
              left:      `${(tooltipX / W) * 100}%`,
              transform: tooltipLeft ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            }}
          >
            <p className="font-semibold text-stone-700 mb-2">
              {formatPeriodLabel(hoverPoint.period, groupBy)}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Receita
                </span>
                <span className="font-mono text-stone-700">{formatCurrency(hoverPoint.revenue)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  Despesa
                </span>
                <span className="font-mono text-stone-700">{formatCurrency(hoverPoint.expense)}</span>
              </div>
              <div className="flex justify-between gap-4 pt-1 border-t border-stone-100 mt-1">
                <span className="text-stone-500">Saldo</span>
                <span
                  className={`font-mono font-medium ${hoverPoint.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {formatCurrency(hoverPoint.balance)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
