import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"
import packageJson from "../package.json"

export const metadata: Metadata = {
  title: "Home Server",
  description: "A compact powerhouse landing page built with shadcn/ui."
}

const APP_VERSION = packageJson.version

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" data-app-version={APP_VERSION}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
