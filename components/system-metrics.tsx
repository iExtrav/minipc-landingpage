"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const METRICS_BASE = "/api/metrics"
const REFRESH_INTERVAL_MS = 1000
const MAX_SAMPLES = 24

const STATUS_LABELS = {
  loading: "Checking",
  online: "Online",
  offline: "Offline",
} as const

const STATUS_STYLES = {
  loading: "border-muted text-muted-foreground",
  online: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  offline: "border-rose-500/40 text-rose-600 dark:text-rose-400",
} as const

type StatusState = keyof typeof STATUS_LABELS

type MetricHistory = {
  cpu: number[]
  memory: number[]
  disk: number[]
}

type ProcessEntry = {
  pid?: number | string
  name?: string
  cpu?: number | null
  memory?: number | null
  command?: string
}

type MetricsState = {
  cpu: {
    total: number | null
    user: number | null
    system: number | null
    iowait: number | null
  }
  memory: {
    percent: number | null
    used: number | null
    total: number | null
    available: number | null
  }
  disk: {
    percent: number | null
    used: number | null
    total: number | null
    mount: string | null
  }
  processes: ProcessEntry[]
  updatedAt: Date | null
}

const EMPTY_METRICS: MetricsState = {
  cpu: { total: null, user: null, system: null, iowait: null },
  memory: { percent: null, used: null, total: null, available: null },
  disk: { percent: null, used: null, total: null, mount: null },
  processes: [],
  updatedAt: null,
}

const EMPTY_HISTORY: MetricHistory = {
  cpu: [],
  memory: [],
  disk: [],
}

const pickNumber = (...values: Array<number | null | undefined>) => {
  return values.find((value) => typeof value === "number" && Number.isFinite(value)) ?? null
}

const clampPercent = (value: number | null) => {
  if (value === null) return null
  return Math.min(100, Math.max(0, value))
}

const formatPercent = (value: number | null) => {
  if (value === null) return "--"
  return `${Math.round(value)}%`
}

const formatBytes = (value: number | null) => {
  if (value === null) return "--"
  if (value === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let idx = 0
  let size = value
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024
    idx += 1
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[idx]}`
}

const formatTimestamp = (date: Date | null) => {
  if (!date) return "--"
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

async function fetchMetrics(endpoint: string) {
  const response = await fetch(`${METRICS_BASE}/${endpoint}`, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Failed to load ${endpoint}`)
  }
  return response.json()
}

function Sparkline({
  data,
  strokeClassName,
  fillClassName,
}: {
  data: number[]
  strokeClassName: string
  fillClassName: string
}) {
  const safeData = data.length > 1 ? data : data.length === 1 ? [data[0], data[0]] : [0, 0]
  const height = 54
  const width = 140
  const padding = 6
  const axisLabelWidth = 22
  const chartHeight = height - padding * 2
  const chartWidth = width - axisLabelWidth - padding
  const originX = axisLabelWidth
  const originY = height - padding
  const topY = padding
  const midY = originY - chartHeight / 2

  const points = safeData.map((value, index) => {
    const x = originX + (index / (safeData.length - 1)) * chartWidth
    const normalized = Math.min(100, Math.max(0, value))
    const y = originY - (normalized / 100) * chartHeight
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const polylinePoints = points.join(" ")
  const polygonPoints = `${originX},${originY} ${polylinePoints} ${
    originX + chartWidth
  },${originY}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-14 w-full"
      role="img"
      aria-hidden="true"
    >
      <g className="stroke-muted-foreground/20">
        <line x1={originX} y1={topY} x2={originX + chartWidth} y2={topY} />
        <line x1={originX} y1={midY} x2={originX + chartWidth} y2={midY} />
      </g>
      <g className="stroke-muted-foreground/40">
        <line x1={originX} y1={topY} x2={originX} y2={originY} />
        <line x1={originX} y1={originY} x2={originX + chartWidth} y2={originY} />
      </g>
      <g className="fill-muted-foreground text-[8px]">
        <text x={originX - 3} y={topY} textAnchor="end" dominantBaseline="middle">
          100
        </text>
        <text x={originX - 3} y={midY} textAnchor="end" dominantBaseline="middle">
          50
        </text>
        <text x={originX - 3} y={originY} textAnchor="end" dominantBaseline="middle">
          0
        </text>
      </g>
      <polygon className={cn("opacity-25", fillClassName)} points={polygonPoints} />
      <polyline
        className={cn("fill-none stroke-[2]", strokeClassName)}
        points={polylinePoints}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MetricPanel({
  label,
  value,
  detail,
  data,
  stroke,
  fill,
  children,
}: {
  label: string
  value: string
  detail?: string
  data: number[]
  stroke: string
  fill: string
  children: React.ReactNode
}) {
  return (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">

      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
      <div className="mt-2">
        <Sparkline data={data} strokeClassName={stroke} fillClassName={fill} />
      </div>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">{children}</div>
    </div>
  )
}

export function SystemMetricsCard() {
  const [status, setStatus] = React.useState<StatusState>("loading")
  const [metrics, setMetrics] = React.useState<MetricsState>(EMPTY_METRICS)
  const [history, setHistory] = React.useState<MetricHistory>(EMPTY_HISTORY)

  React.useEffect(() => {
    let active = true

    const loadMetrics = async () => {
      const results = await Promise.allSettled([
        fetchMetrics("cpu"),
        fetchMetrics("mem"),
        fetchMetrics("fs"),
        fetchMetrics("processlist"),
      ])

      if (!active) return

      const cpuData = results[0].status === "fulfilled" ? results[0].value : null
      const memData = results[1].status === "fulfilled" ? results[1].value : null
      const fsData = results[2].status === "fulfilled" ? results[2].value : null
      const processData = results[3].status === "fulfilled" ? results[3].value : null

      const cpuTotal = clampPercent(
        pickNumber(cpuData?.total, cpuData?.cpu_percent, cpuData?.total_percent),
      )
      const cpuUser = clampPercent(pickNumber(cpuData?.user, cpuData?.user_percent))
      const cpuSystem = clampPercent(pickNumber(cpuData?.system, cpuData?.system_percent))
      const cpuIowait = clampPercent(pickNumber(cpuData?.iowait, cpuData?.iowait_percent))

      const memoryPercent = clampPercent(
        pickNumber(memData?.percent, memData?.used_percent, memData?.mem_percent),
      )
      const memoryUsed = pickNumber(memData?.used, memData?.used_memory)
      const memoryTotal = pickNumber(memData?.total, memData?.total_memory)
      const memoryAvailable = pickNumber(memData?.available, memData?.available_memory)

      const fsList = Array.isArray(fsData) ? fsData : fsData?.filesystems
      const preferredFs = Array.isArray(fsList)
        ? fsList.find((entry) => entry?.mnt_point === "/" || entry?.mountpoint === "/") ??
          fsList[0]
        : null
      const diskPercent = clampPercent(
        pickNumber(preferredFs?.percent, preferredFs?.used_percent),
      )
      const diskUsed = pickNumber(preferredFs?.used, preferredFs?.used_bytes)
      const diskTotal = pickNumber(preferredFs?.size, preferredFs?.total, preferredFs?.total_bytes)
      const diskMount =
        preferredFs?.mnt_point ??
        preferredFs?.mountpoint ??
        preferredFs?.device_name ??
        null

      const rawProcesses = Array.isArray(processData)
        ? processData
        : processData?.processlist
      const normalizedProcesses = Array.isArray(rawProcesses)
        ? rawProcesses
            .map((proc) => ({
              pid: proc?.pid ?? proc?.PID,
              name: proc?.name ?? proc?.command ?? proc?.cmdline ?? "unknown",
              cpu: clampPercent(pickNumber(proc?.cpu_percent, proc?.cpu)),
              memory: clampPercent(
                pickNumber(proc?.memory_percent, proc?.mem_percent, proc?.mem),
              ),
              command: proc?.cmdline ?? proc?.command,
            }))
            .filter((proc) => proc.name)
        : []

      const sortedProcesses = [...normalizedProcesses].sort((a, b) => {
        const cpuDiff = (b.cpu ?? 0) - (a.cpu ?? 0)
        if (cpuDiff !== 0) return cpuDiff
        return (b.memory ?? 0) - (a.memory ?? 0)
      })

      const topProcesses = sortedProcesses.slice(0, 4)
      const anySuccess = Boolean(cpuData || memData || fsData || processData)

      setStatus(anySuccess ? "online" : "offline")
      setMetrics({
        cpu: { total: cpuTotal, user: cpuUser, system: cpuSystem, iowait: cpuIowait },
        memory: {
          percent: memoryPercent,
          used: memoryUsed,
          total: memoryTotal,
          available: memoryAvailable,
        },
        disk: {
          percent: diskPercent,
          used: diskUsed,
          total: diskTotal,
          mount: diskMount,
        },
        processes: topProcesses,
        updatedAt: new Date(),
      })

      setHistory((prev) => ({
        cpu: cpuTotal !== null ? [...prev.cpu, cpuTotal].slice(-MAX_SAMPLES) : prev.cpu,
        memory:
          memoryPercent !== null
            ? [...prev.memory, memoryPercent].slice(-MAX_SAMPLES)
            : prev.memory,
        disk: diskPercent !== null ? [...prev.disk, diskPercent].slice(-MAX_SAMPLES) : prev.disk,
      }))
    }

    loadMetrics()
    const intervalId = window.setInterval(loadMetrics, REFRESH_INTERVAL_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  const memoryUsageLabel =
    metrics.memory.used !== null && metrics.memory.total !== null
      ? `${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)}`
      : "Usage data pending"

  const diskUsageLabel =
    metrics.disk.used !== null && metrics.disk.total !== null
      ? `${formatBytes(metrics.disk.used)} / ${formatBytes(metrics.disk.total)}`
      : "Usage data pending"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System metrics</CardTitle>
          <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <CardDescription>Live CPU, memory, disk, and process telemetry</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 text-sm text-muted-foreground">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricPanel
            label="CPU load"
            value={formatPercent(metrics.cpu.total)}
            detail="Aggregate utilization"
            data={history.cpu}
            stroke="stroke-emerald-500"
            fill="fill-emerald-500"
          >
            <div className="flex items-center justify-between">
              <span>User</span>
              <span className="text-foreground">{formatPercent(metrics.cpu.user)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>System</span>
              <span className="text-foreground">{formatPercent(metrics.cpu.system)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>I/O wait</span>
              <span className="text-foreground">{formatPercent(metrics.cpu.iowait)}</span>
            </div>
          </MetricPanel>

          <MetricPanel
            label="Memory usage"
            value={formatPercent(metrics.memory.percent)}
            detail={memoryUsageLabel}
            data={history.memory}
            stroke="stroke-sky-500"
            fill="fill-sky-500"
          >
            <div className="flex items-center justify-between">
              <span>Available</span>
              <span className="text-foreground">{formatBytes(metrics.memory.available)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span className="text-foreground">{formatBytes(metrics.memory.total)}</span>
            </div>
          </MetricPanel>

          <MetricPanel
            label="Storage usage"
            value={formatPercent(metrics.disk.percent)}
            detail={diskUsageLabel}
            data={history.disk}
            stroke="stroke-amber-500"
            fill="fill-amber-500"
          >
            <div className="flex items-center justify-between">
              <span>Mount</span>
              <span className="text-foreground">{metrics.disk.mount ?? "--"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span className="text-foreground">{formatBytes(metrics.disk.total)}</span>
            </div>
          </MetricPanel>

    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">

            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Top processes
              </p>
              <span className="text-xs text-muted-foreground">
                {metrics.processes.length ? `${metrics.processes.length} shown` : "No data"}
              </span>
            </div>
            <div className="mt-2 grid gap-2 text-xs text-muted-foreground">
              {metrics.processes.length ? (
                metrics.processes.map((process) => (
                  <div
                    key={`${process.name}-${process.pid}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{process.name}</p>
                      <p className="text-xs text-muted-foreground">PID {process.pid ?? "--"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">
                        {formatPercent(process.cpu ?? null)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(process.memory ?? null)} RAM
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Waiting for process data.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>Last sync: {formatTimestamp(metrics.updatedAt)}</span>
          <span>Refreshes every {REFRESH_INTERVAL_MS / 1000}s</span>
        </div>
      </CardContent>
    </Card>
  )
}
