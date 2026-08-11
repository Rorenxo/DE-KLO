import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
import { Info } from 'lucide-react'

const COLORS = {
  bull: '#20D47B',
  bear: '#FF4D5E',
  neutral: '#8B949E',
  bgDark: '#0B1018',
  bgPanel: '#0E1420',
  border: '#1E2937',
  textMain: '#D1D7E0',
  textMuted: '#7F8A9A',
  grid: '#1C2533',
  ma7: '#F6B93B',
  ma14: '#59C3FF',
  ma28: '#CE8BFF',
}

const MODES = ['Candle', 'Line']
const RANGES = ['10', '7D', '1M', '3M', '1Y', 'All']

// Fixed, compact bar spacing so candles stay thin and packed to the left
// instead of stretching to fill the container when there isn't much data
// yet. More transactions over time will naturally fill the space and the
// chart becomes horizontally scrollable.
const BAR_SPACING = 14
const MIN_BAR_SPACING = 6

function formatPeso(value, decimals = 2) {
  return `₱${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function toTimestampMs(tx) {
  const raw = tx?.transaction_date || tx?.created_at
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function getSignedAmount(tx) {
  const amount = Number(tx?.amount) || 0
  const type = String(tx?.type || '').toLowerCase()

  if (type === 'deposit' || type === 'income') return amount
  if (type === 'withdrawal' || type === 'expense') return -amount
  return 0
}

function normalizeTransactions(transactions) {
  return (transactions || [])
    .map((tx) => {
      const timestamp = toTimestampMs(tx)
      if (!timestamp) return null
      return {
        id: tx.id,
        timestamp,
        signedAmount: getSignedAmount(tx),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp)
}

function buildEvents(sortedTx) {
  const events = []
  let runningBalance = 0

  sortedTx.forEach((tx) => {
    const openBalance = runningBalance
    runningBalance += tx.signedAmount

    events.push({
      id: tx.id,
      timestamp: tx.timestamp,
      signedAmount: tx.signedAmount,
      absAmount: Math.abs(tx.signedAmount),
      openBalance,
      closeBalance: runningBalance,
    })
  })

  return events
}

// Range controls filter the underlying transaction history — they never
// bucket/aggregate multiple transactions into one candle. Every real
// balance movement gets its own candle, per the product spec.
function rangeCutoffMs(range) {
  const now = Date.now()

  if (range === '7D') return now - 7 * 24 * 60 * 60 * 1000
  if (range === '1M') return now - 30 * 24 * 60 * 60 * 1000
  if (range === '3M') return now - 90 * 24 * 60 * 60 * 1000
  if (range === '1Y') return now - 365 * 24 * 60 * 60 * 1000

  // '10' and 'All' are not date-bounded — '10' is count-bounded (handled
  // separately below) and 'All' means the entire history.
  return null
}

function toCandles(events, range) {
  if (!events.length) return []

  let usableEvents = events

  if (range === '10') {
    usableEvents = events.slice(-10)
  } else {
    const cutoff = rangeCutoffMs(range)
    if (cutoff) usableEvents = events.filter((e) => e.timestamp >= cutoff)
  }

  if (!usableEvents.length) return []

  // Each candle is exactly one real balance movement:
  // OPEN = balance right before the transaction, CLOSE = balance right
  // after it, HIGH/LOW are simply the max/min of those two — never a
  // fabricated ₱0 floor or invented range. `time` is a synthetic,
  // strictly-increasing sequence index (not a real timestamp) since the
  // chart intentionally shows chronological progression with no visible
  // dates, and this also guarantees unique ascending x-values even when
  // multiple transactions land in the same second.
  return usableEvents.map((event, index) => {
    const open = event.openBalance
    const close = event.closeBalance

    return {
      time: index,
      timestamp: event.timestamp,
      open,
      close,
      high: Math.max(open, close),
      low: Math.min(open, close),
      activity: event.absAmount,
      isBullish: close > open,
      isBearish: close < open,
    }
  })
}

// Computes a tight, sensible Y-axis range from the actual candle data.
// - Never fabricates a ₱0 floor or a large empty ceiling.
// - Adds proportional padding so candles aren't jammed against the edges.
// - Only clamps the floor at ₱0 if the padded range would dip below zero
//   AND the user's real balance history never went negative — it never
//   extends further negative than that.
function computeAutoscaleRange(candles) {
  if (!candles.length) return null

  let min = Infinity
  let max = -Infinity

  candles.forEach((c) => {
    if (c.low < min) min = c.low
    if (c.high > max) max = c.high
  })

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null

  if (min === max) {
    // Flat / single value history — pad symmetrically around it.
    const base = Math.abs(min) || 100
    const pad = Math.max(base * 0.1, 10)
    return { minValue: min - pad, maxValue: max + pad }
  }

  const range = max - min
  const pad = Math.max(range * 0.12, range * 0.01, 1)

  let minValue = min - pad
  const maxValue = max + pad

  if (min >= 0 && minValue < 0) minValue = 0

  return { minValue, maxValue }
}

// Adds a small cosmetic wick above and below every candle body so each one
// gets a visible thin line, even when the real high/low exactly equal the
// body edges (which is normal here — a balance movement has no in-between
// excursion the way a market price does). This never changes the real
// open/close/high/low reported in the tooltip or used for scaling logic —
// it only affects what gets drawn on the candlestick series.
function buildDisplayCandles(candles, autoscaleRange) {
  if (!candles.length) return candles

  const overallRange = autoscaleRange ? autoscaleRange.maxValue - autoscaleRange.minValue : 0
  const wickPad = overallRange > 0 ? overallRange * 0.015 : 0
  if (wickPad <= 0) return candles

  const everNegative = candles.some((c) => c.low < 0)

  return candles.map((c) => {
    const paddedLow = c.low - wickPad
    return {
      ...c,
      high: c.high + wickPad,
      low: everNegative ? paddedLow : Math.max(0, paddedLow),
    }
  })
}

function buildMA(candles, period) {
  const result = []

  for (let i = period - 1; i < candles.length; i += 1) {
    const slice = candles.slice(i - period + 1, i + 1)
    const value = slice.reduce((acc, c) => acc + c.close, 0) / period
    result.push({ time: candles[i].time, value })
  }

  return result
}

// Splits the running-balance line into green ("up") and red ("down")
// segments, like the reference chart. Each series covers the full time
// domain: at indices where a color doesn't apply it gets a whitespace
// entry (time only, no value) so the line simply doesn't draw there
// instead of jumping across the gap. Shared boundary points get a value
// in both series so the color transitions at a clean, connected vertex.
function buildBiColorLine(candles) {
  const green = candles.map((c) => ({ time: c.time }))
  const red = candles.map((c) => ({ time: c.time }))

  if (candles.length === 1) {
    green[0] = { time: candles[0].time, value: candles[0].close }
    return { green, red }
  }

  for (let i = 1; i < candles.length; i += 1) {
    const prev = candles[i - 1]
    const curr = candles[i]
    const isUp = curr.close >= prev.close
    const target = isUp ? green : red

    target[i - 1] = { time: prev.time, value: prev.close }
    target[i] = { time: curr.time, value: curr.close }
  }

  return { green, red }
}

export default function BalanceTrendChart({ transactions = [] }) {
  const [mode, setMode] = useState('Candle')
  const [range, setRange] = useState('1M')
  const [hoveredCandle, setHoveredCandle] = useState(null)

  const chartContainerRef = useRef(null)

  const normalizedTransactions = useMemo(() => normalizeTransactions(transactions), [transactions])
  const events = useMemo(() => buildEvents(normalizedTransactions), [normalizedTransactions])

  const candles = useMemo(() => toCandles(events, range), [events, range])
  const autoscaleRange = useMemo(() => computeAutoscaleRange(candles), [candles])
  const displayCandles = useMemo(
    () => buildDisplayCandles(candles, autoscaleRange),
    [candles, autoscaleRange]
  )
  const biColorLine = useMemo(() => buildBiColorLine(candles), [candles])
  const ma7Data = useMemo(() => buildMA(candles, 7), [candles])
  const ma14Data = useMemo(() => buildMA(candles, 14), [candles])
  const ma28Data = useMemo(() => buildMA(candles, 28), [candles])

  const latest = candles[candles.length - 1] || null
  const previous = candles[candles.length - 2] || null

  useEffect(() => {
    const container = chartContainerRef.current
    if (!container || candles.length === 0) return undefined

    const width = Math.max(260, container.clientWidth)
    const height = 320

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { color: COLORS.bgDark },
        textColor: COLORS.textMuted,
        // Hides the "powered by" attribution logo/watermark.
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: COLORS.grid, style: LineStyle.Solid, visible: true },
        horzLines: { color: COLORS.grid, style: LineStyle.Solid, visible: true },
      },
      rightPriceScale: {
        visible: true,
        borderColor: COLORS.border,
        scaleMargins: { top: 0.08, bottom: 0.27 },
      },
      timeScale: {
        visible: false,
        borderVisible: false,
        rightOffset: 4,
        barSpacing: BAR_SPACING,
        minBarSpacing: MIN_BAR_SPACING,
        fixLeftEdge: true,
        fixRightEdge: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#3A465A',
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: '#1B2638',
        },
        horzLine: {
          color: '#3A465A',
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: '#1B2638',
        },
      },
      localization: {
        priceFormatter: (price) => formatPeso(price, 2),
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    // A custom autoscale provider gives us full control over the Y-axis
    // range instead of trusting default library behavior — it never pins
    // the floor to ₱0 and never leaves large empty space above/below the
    // user's actual balance history (see computeAutoscaleRange above).
    const autoscaleInfoProvider = () =>
      autoscaleRange ? { priceRange: autoscaleRange } : null

    const candleSeries = chart.addCandlestickSeries({
      upColor: COLORS.bull,
      downColor: COLORS.bear,
      borderVisible: true,
      wickUpColor: COLORS.bull,
      wickDownColor: COLORS.bear,
      borderUpColor: COLORS.bull,
      borderDownColor: COLORS.bear,
      priceLineVisible: false,
      // The current-balance price line below already renders the single
      // balance label at the right edge — leaving this on would draw a
      // second, duplicate label at the same spot.
      lastValueVisible: false,
      autoscaleInfoProvider,
    })

    // Line mode is split into a green ("up") series and a red ("down")
    // series so both colors are visible along the running-balance line,
    // instead of a single flat-colored line.
    const greenLineSeries = chart.addLineSeries({
      color: COLORS.bull,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      lastValueVisible: false,
      autoscaleInfoProvider,
    })

    const redLineSeries = chart.addLineSeries({
      color: COLORS.bear,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      lastValueVisible: false,
      autoscaleInfoProvider,
    })

    const activitySeries = chart.addHistogramSeries({
      priceScaleId: 'activity',
      priceFormat: { type: 'volume' },
      base: 0,
      lastValueVisible: false,
      priceLineVisible: false,
    })

    chart.priceScale('activity').applyOptions({
      visible: false,
      scaleMargins: { top: 0.78, bottom: 0 },
    })

    const ma7Series = chart.addLineSeries({
      color: COLORS.ma7,
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
    })

    const ma14Series = chart.addLineSeries({
      color: COLORS.ma14,
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
    })

    const ma28Series = chart.addLineSeries({
      color: COLORS.ma28,
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
    })

    candleSeries.setData(displayCandles)
    greenLineSeries.setData(biColorLine.green)
    redLineSeries.setData(biColorLine.red)
    ma7Series.setData(ma7Data)
    ma14Series.setData(ma14Data)
    ma28Series.setData(ma28Data)

    activitySeries.setData(
      candles.map((c) => {
        let color = 'rgba(139, 148, 158, 0.24)'
        if (c.isBullish) color = 'rgba(32, 212, 123, 0.24)'
        if (c.isBearish) color = 'rgba(255, 77, 94, 0.24)'

        return {
          time: c.time,
          value: c.activity,
          color,
        }
      })
    )

    candleSeries.applyOptions({ visible: mode === 'Candle' })
    greenLineSeries.applyOptions({ visible: mode === 'Line' })
    redLineSeries.applyOptions({ visible: mode === 'Line' })
    ma7Series.applyOptions({ visible: mode === 'Candle' && ma7Data.length > 0 })
    ma14Series.applyOptions({ visible: mode === 'Candle' && ma14Data.length > 0 })
    ma28Series.applyOptions({ visible: mode === 'Candle' && ma28Data.length > 0 })

    // Re-assert the fixed, compact bar spacing after setData — otherwise
    // the chart's default "fit all bars to the container" behavior would
    // stretch a handful of candles across the full width, making them look
    // fat instead of thin and packed to the left.
    chart.timeScale().applyOptions({ barSpacing: BAR_SPACING, minBarSpacing: MIN_BAR_SPACING })

    let priceLine = null
    let handleMove = null
    let resizeObserver = null

    if (latest) {
      const isUp = latest.close >= latest.open
      const labelColor = isUp ? COLORS.bull : COLORS.bear

      // In Line mode, attach the label to whichever colored series actually
      // carries the latest point's value.
      const lastIsUp = !previous || latest.close >= previous.close
      const anchorSeries =
        mode === 'Candle' ? candleSeries : lastIsUp ? greenLineSeries : redLineSeries

      priceLine = anchorSeries.createPriceLine({
        price: latest.close,
        color: labelColor,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: formatPeso(latest.close, 2),
      })

      const candleByTime = new Map(candles.map((c) => [Number(c.time), c]))

      handleMove = (param) => {
        if (!param?.time) {
          setHoveredCandle(null)
          return
        }

        const target = candleByTime.get(Number(param.time))
        if (!target) {
          setHoveredCandle(null)
          return
        }

        setHoveredCandle(target)
      }

      chart.subscribeCrosshairMove(handleMove)

      resizeObserver = new ResizeObserver(() => {
        const newWidth = Math.max(260, container.clientWidth)
        chart.applyOptions({ width: newWidth })
        chart.timeScale().applyOptions({ barSpacing: BAR_SPACING, minBarSpacing: MIN_BAR_SPACING })
      })

      resizeObserver.observe(container)
    }

    return () => {
      if (handleMove) chart.unsubscribeCrosshairMove(handleMove)
      if (priceLine) {
        const anchor =
          mode === 'Candle' ? candleSeries : latest && (!previous || latest.close >= previous.close) ? greenLineSeries : redLineSeries
        anchor.removePriceLine(priceLine)
      }
      if (resizeObserver) resizeObserver.disconnect()
      chart.remove()
    }
  }, [candles, displayCandles, biColorLine, autoscaleRange, latest, previous, ma7Data, ma14Data, ma28Data, mode])

  const hasTransactions = normalizedTransactions.length > 0

  const latestBalance = latest ? latest.close : 0
  const diff = latest && previous ? latest.close - previous.close : 0
  const diffPct = previous && previous.close !== 0 ? (diff / previous.close) * 100 : 0

  const latestMa = {
    ma7: ma7Data.length > 0 ? ma7Data[ma7Data.length - 1].value : null,
    ma14: ma14Data.length > 0 ? ma14Data[ma14Data.length - 1].value : null,
    ma28: ma28Data.length > 0 ? ma28Data[ma28Data.length - 1].value : null,
  }

  return (
    <div className="rounded-2xl border border-[#1E2937] bg-[#0E1420] p-3.5 sm:p-4 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-2 pb-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-[#D1D7E0]">Chart</span>
          <Info className="w-3 h-3 text-[#7F8A9A]" />
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#121A2A] border border-[#1E2937] text-[#7F8A9A] uppercase tracking-wider">
              Activity
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border border-[#293446] bg-[#111A2B] p-0.5">
            {MODES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  mode === item
                    ? 'bg-[#20D47B] text-[#07120D]'
                    : 'text-[#8FA0B5] hover:text-[#DCE6F2]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar pb-2">
        <div className="inline-flex items-center rounded-lg border border-[#293446] bg-[#111A2B] p-0.5 min-w-max">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`px-2.5 sm:px-3 py-1 text-[10px] font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                range === item
                  ? 'bg-[#20D47B] text-[#07120D]'
                  : 'text-[#8FA0B5] hover:text-[#DCE6F2]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {hasTransactions ? (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-[#E5ECF5]">{formatPeso(latestBalance, 2)}</span>
            {latest && previous ? (
              <span className={`text-[10px] font-mono font-bold ${diff >= 0 ? 'text-[#20D47B]' : 'text-[#FF4D5E]'}`}>
                {diff >= 0 ? '+' : ''}
                {formatPeso(diff, 2)} ({diff >= 0 ? '+' : ''}
                {diffPct.toFixed(2)}%)
              </span>
            ) : null}

            {mode === 'Candle' ? (
              <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-mono font-semibold ml-auto">
                {latestMa.ma7 !== null ? <span className="text-[#F6B93B]">MA7: {Math.round(latestMa.ma7).toLocaleString()}</span> : null}
                {latestMa.ma14 !== null ? <span className="text-[#59C3FF]">MA14: {Math.round(latestMa.ma14).toLocaleString()}</span> : null}
                {latestMa.ma28 !== null ? <span className="text-[#CE8BFF]">MA28: {Math.round(latestMa.ma28).toLocaleString()}</span> : null}
              </div>
            ) : null}
          </div>

          <div className="relative rounded-xl border border-[#1E2937] bg-[#0B1018] overflow-hidden">
            <div ref={chartContainerRef} className="w-full" />

            {hoveredCandle ? (
              <div className="absolute left-2 top-2 z-20 rounded-lg border border-[#2B3648] bg-[#0D1524]/95 px-2.5 py-2 text-[10px] font-mono text-[#D7E1EE] shadow-lg backdrop-blur-sm">
                <div className="pb-1.5 mb-1.5 border-b border-[#2B3648]">
                  <div className="text-[9px] uppercase tracking-wider text-[#8FA0B5]">Balance</div>
                  <div className={`text-sm font-bold ${hoveredCandle.close >= hoveredCandle.open ? 'text-[#20D47B]' : 'text-[#FF4D5E]'}`}>
                    {formatPeso(hoveredCandle.close, 2)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <div className="text-[8px] uppercase tracking-wider text-[#8FA0B5]">Open</div>
                    <div>{formatPeso(hoveredCandle.open, 2)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] uppercase tracking-wider text-[#8FA0B5]">Close</div>
                    <div>{formatPeso(hoveredCandle.close, 2)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] uppercase tracking-wider text-[#20D47B]">High</div>
                    <div>{formatPeso(hoveredCandle.high, 2)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] uppercase tracking-wider text-[#FF4D5E]">Low</div>
                    <div>{formatPeso(hoveredCandle.low, 2)}</div>
                  </div>
                </div>
                <div className="pt-1.5 mt-1.5 border-t border-[#2B3648]">
                  <span className="text-[8px] uppercase tracking-wider text-[#8FA0B5]">Activity </span>
                  <span>{formatPeso(hoveredCandle.activity, 2)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-[#1E2937] bg-[#0B1018] px-5 py-12 text-center">
          <div className="mx-auto mb-2 w-10 h-10 rounded-xl bg-[#121A2A] border border-[#1E2937] flex items-center justify-center">
            <Info className="w-5 h-5 text-[#7F8A9A]" />
          </div>
          <p className="text-sm font-bold text-[#D1D7E0]">No balance history yet</p>
          <p className="mt-1 text-xs text-[#7F8A9A]">
            Add your first transaction to start building your balance trend.
          </p>
        </div>
      )}

      {hasTransactions && candles.length === 0 ? (
        <div className="mt-3 rounded-xl border border-[#1E2937] bg-[#0B1018] px-4 py-3 text-xs text-[#8FA0B5] text-center">
          No balance activity found for the selected range.
        </div>
      ) : null}
    </div>
  )
}