import { CopyButton } from "@/components/copy-button"
import { ServiceStatus } from "@/components/service-status"
import { SystemMetricsCard } from "@/components/system-metrics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const services = [
  {
    name: "Portainer",
    description: "Docker management dashboard",
    url: "https://192.168.4.142:9443",
    pingUrl: "https://192.168.4.142:9443/favicon.ico",
    category: "Containers",
  },
  {
    name: "Pterodactyl",
    description: "Game server management",
    url: "http://192.168.4.142:8081",
    pingUrl: "http://192.168.4.142:8081/favicon.ico",
    category: "Servers",
  },
  {
    name: "Pi-hole",
    description: "DNS ad blocking",
    url: "http://192.168.4.142:8082/admin",
    pingUrl: "http://192.168.4.142:8082/admin/favicon.ico",
    category: "Network",
  },
]

const quickActions = [
  {
    label: "SSH",
    description: "Open a secure shell session",
    url: "ssh://administrator@192.168.4.140:22",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Home Server</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Shortcuts to local services
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">Ubuntu 22.04</Badge>
            <Badge variant="outline">LAN only</Badge>
            <span>192.168.4.142</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="grid gap-6">
          <SystemMetricsCard />

          <Card>
            <CardHeader>
              <CardTitle>Shortcuts</CardTitle>
              <CardDescription>Daily maintenance links</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {quickActions.map((action) => (
                <div key={action.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end">
                    <CopyButton value={action.url} label="Copy" />
                    <Button asChild size="sm">
                      <a
                        href={action.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Services</h2>
            <p className="text-sm text-muted-foreground">
              Direct links to core dashboards
            </p>
          </div>
          <Badge variant="secondary">{services.length} tracked</Badge>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.name} className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{service.name}</CardTitle>
                  <ServiceStatus url={service.url} pingUrl={service.pingUrl} />
                </div>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {service.category}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {service.url}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CopyButton value={service.url} label="Copy" />
                  <Button asChild size="sm">
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}
