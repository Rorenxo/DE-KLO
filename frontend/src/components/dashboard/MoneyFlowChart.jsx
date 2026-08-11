import React, { useState } from 'react'
import { ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import ScrollFadeIn from '../ui/ScrollFadeIn'

export default function MoneyFlowChart({ theme = 'dark', customDatasets = null }) {
  const [period, setPeriod] = useState('Per Month')
  const [showDropdown, setShowDropdown] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const isLight = theme === 'light'

  const defaultDatasets = {
    'Per Week': [
      { label: 'Mon', income: 0, expense: 0 },
      { label: 'Tue', income: 0, expense: 0 },
      { label: 'Wed', income: 0, expense: 0 },
      { label: 'Thu', income: 0, expense: 0 },
      { label: 'Fri', income: 0, expense: 0 },
      { label: 'Sat', income: 0, expense: 0 },
      { label: 'Sun', income: 0, expense: 0 },
    ],
    'Per Month': [
      { label: 'Jan', income: 0, expense: 0 },
      { label: 'Feb', income: 0, expense: 0 },
      { label: 'Mar', income: 0, expense: 0 },
      { label: 'Apr', income: 0, expense: 0 },
      { label: 'May', income: 0, expense: 0 },
      { label: 'Jun', income: 0, expense: 0 },
    ],
    'Per Year': [
      { label: '2026', income: 0, expense: 0 },
      { label: '2027', income: 0, expense: 0 },
      { label: '2028', income: 0, expense: 0 },
      { label: '2029', income: 0, expense: 0 },
      { label: '2030', income: 0, expense: 0 },
    ],
  }

  const datasets = customDatasets || defaultDatasets
  const data = datasets[period] || datasets['Per Month']

  const rawMax = Math.max(
    ...data.flatMap((d) => [Number(d.income) || 0, Number(d.expense) || 0]),
    0
  )

  let MAX_VAL = 1000
  if (period === 'Per Month') {
    MAX_VAL = Math.max(20000, Math.ceil(rawMax / 5000) * 5000)
  } else if (period === 'Per Year') {
    MAX_VAL = Math.max(50000, Math.ceil(rawMax / 10000) * 10000)
  } else {
    MAX_VAL = rawMax > 1000 ? Math.ceil(rawMax / 1000) * 1000 : 1000
  }

  const formatVal = (v) => {
    if (v >= 1000) return `₱${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
    return `₱${v}`
  }

  const svgWidth = 600
  const svgHeight = 240
  const paddingLeft = 45
  const paddingRight = 25
  const paddingTop = 20
  const paddingBottom = 35

  const chartW = svgWidth - paddingLeft - paddingRight
  const chartH = svgHeight - paddingTop - paddingBottom

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartW
    const incomeY = paddingTop + chartH - (d.income / MAX_VAL) * chartH
    const expenseY = paddingTop + chartH - (d.expense / MAX_VAL) * chartH
    return { ...d, x, incomeY, expenseY, index: i }
  })

  const getPointToPointPath = (pts, key) => {
    if (!pts || !pts.length) return ''
    return pts.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt[key]}`,
      ''
    )
  }

  const getAreaPath = (pts, key) => {
    if (!pts || !pts.length) return ''
    const linePath = getPointToPointPath(pts, key)
    const lastX = pts[pts.length - 1].x
    const firstX = pts[0].x
    const bottomY = paddingTop + chartH
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }

  const incomeLinePath = getPointToPointPath(points, 'incomeY')
  const incomeAreaPath = getAreaPath(points, 'incomeY')
  const expenseLinePath = getPointToPointPath(points, 'expenseY')
  const expenseAreaPath = getAreaPath(points, 'expenseY')

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null

  const yTicks = [
    MAX_VAL,
    MAX_VAL * 0.8,
    MAX_VAL * 0.6,
    MAX_VAL * 0.4,
    MAX_VAL * 0.2,
    0,
  ]

  return (
    <ScrollFadeIn delay={150}>
      <div className={`w-full p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm transition-all ${
        isLight
          ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
          : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-black/5 dark:border-white/5">
          <div>
            <h3 className={`text-sm sm:text-base font-bold font-sans tracking-tight ${
              isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
            }`}>
              Cash Flow
            </h3>
            <p className={`text-xs mt-0.5 ${
              isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
            }`}>
              Real-time income and expense flow metrics
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                Income
              </span>
              <span className="flex items-center gap-1.5 font-medium text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]" />
                Expenses
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-medium transition-all cursor-pointer ${isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black'
                    : 'bg-[#000000]/70 border-[#4a5156]/60 text-[#bdc7ce] hover:text-white hover:border-[#808a92]'
                  }`}
              >
                <span>{period}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showDropdown && (
                <div className={`absolute right-0 mt-1 w-36 border rounded-xl shadow-2xl z-30 overflow-hidden py-1 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#1c1f24] border-[#4a5156] text-white'
                  }`}>
                  {Object.keys(datasets).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p)
                        setShowDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${period === p
                          ? isLight ? 'bg-slate-100 font-semibold text-slate-900' : 'bg-white/10 text-white font-semibold'
                          : isLight ? 'text-slate-600 hover:text-black' : 'text-[#808a92] hover:text-white'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>

              <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {yTicks.map((val) => {
              const y = paddingTop + chartH - (val / MAX_VAL) * chartH
              return (
                <g key={val}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke={isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.18)'}
                    strokeDasharray={val === 0 ? '0' : '4 4'}
                    strokeWidth={val === 0 ? '1.5' : '1'}
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    fill={isLight ? '#475569' : '#a1a1aa'}
                    fontSize="10"
                    fontWeight="500"
                    textAnchor="end"
                    fontFamily="sans-serif"
                  >
                    {formatVal(val)}
                  </text>
                </g>
              )
            })}

            {points.map((pt) => (
              <text
                key={pt.label}
                x={pt.x}
                y={svgHeight - 10}
                fill={isLight ? '#64748b' : '#808a92'}
                fontSize="10"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {pt.label}
              </text>
            ))}

            <path d={expenseAreaPath} fill="url(#expenseGradient)" opacity="0.5" />
            <path d={incomeAreaPath} fill="url(#incomeGradient)" opacity="0.4" />

            {points.map((pt, i) => (
              <g key={`conn-${i}`}>
                <line
                  x1={pt.x}
                  y1={Math.min(pt.incomeY, pt.expenseY)}
                  x2={pt.x}
                  y2={Math.max(pt.incomeY, pt.expenseY)}
                  stroke={isLight ? '#94a3b8' : '#64748b'}
                  strokeDasharray="2 2"
                  strokeWidth="1.5"
                  opacity="0.75"
                />
                <line
                  x1={pt.x}
                  y1={Math.max(pt.incomeY, pt.expenseY)}
                  x2={pt.x}
                  y2={paddingTop + chartH}
                  stroke={isLight ? '#e2e8f0' : '#2d333b'}
                  strokeDasharray="2 2"
                  strokeWidth="1"
                  opacity="0.4"
                />
              </g>
            ))}

            <path
              d={expenseLinePath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 2px rgba(244, 63, 94, 0.4))' }}
            />

            <path
              d={incomeLinePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))' }}
            />

            {activePoint && (
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={paddingTop + chartH}
                stroke="#ffffff"
                strokeOpacity="0.4"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
            )}

            {points.map((pt, i) => {
              const isHovered = hoveredIdx === i

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <rect
                    x={pt.x - chartW / (points.length * 2)}
                    y={paddingTop}
                    width={chartW / points.length}
                    height={chartH}
                    fill="transparent"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.expenseY}
                    r={isHovered ? 5.5 : 4}
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 0 2px rgba(244, 63, 94, 0.5))' }}
                  />

                  <circle
                    cx={pt.x}
                    cy={pt.incomeY}
                    r={isHovered ? 6.5 : 5}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.5))' }}
                  />
                </g>
              )
            })}
          </svg>

          {activePoint && (
            <div
              className={`absolute top-2 z-20 pointer-events-none bg-[#000000]/95 border border-white/25 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1 animate-fade-in ${hoveredIdx === 0
                  ? 'translate-x-0'
                  : hoveredIdx >= points.length - 2
                    ? 'transform -translate-x-full'
                    : 'transform -translate-x-1/2'
                }`}
              style={{
                left:
                  hoveredIdx === 0
                    ? '52px'
                    : hoveredIdx >= points.length - 2
                      ? `${((activePoint.x - 12) / svgWidth) * 100}%`
                      : `${((activePoint.x) / svgWidth) * 100}%`,
              }}
            >
              <div className="font-bold text-white text-[11px] border-b border-white/10 pb-1 flex justify-between gap-3">
                <span>{activePoint.label}</span>
                <span className="text-[#808a92]">Metrics</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-400 font-medium text-[11px]">
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Inc:
                </span>
                <span>₱{activePoint.income.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-rose-400 font-medium text-[11px]">
                <span className="flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> Exp:
                </span>
                <span>₱{activePoint.expense.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-white font-bold text-[11px] pt-0.5 border-t border-white/10">
                <span>Net:</span>
                <span className={activePoint.income - activePoint.expense >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  ₱{(activePoint.income - activePoint.expense).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollFadeIn>
  )
}
