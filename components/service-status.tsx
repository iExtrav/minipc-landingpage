"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ServiceStatusState = "checking" | "online" | "offline"

const STATUS_LABELS: Record<ServiceStatusState, string> = {
  checking: "Checking",
  online: "Online",
  offline: "Offline",
}

const STATUS_STYLES: Record<ServiceStatusState, string> = {
  checking: "border-muted text-muted-foreground",
  online: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  offline: "border-rose-500/40 text-rose-600 dark:text-rose-400",
}

type ServiceStatusProps = {
  url: string
  pingUrl?: string
  timeoutMs?: number
}

export function ServiceStatus({
  url,
  pingUrl,
  timeoutMs = 2500,
}: ServiceStatusProps) {
  const [status, setStatus] = React.useState<ServiceStatusState>("checking")
  const targetUrl = React.useMemo(() => pingUrl ?? url, [pingUrl, url])

  React.useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

    fetch(targetUrl, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(() => {
        if (active) {
          setStatus("online")
        }
      })
      .catch(() => {
        if (active) {
          setStatus("offline")
        }
      })
      .finally(() => {
        clearTimeout(timeoutId)
      })

    return () => {
      active = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [targetUrl, timeoutMs])

  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
