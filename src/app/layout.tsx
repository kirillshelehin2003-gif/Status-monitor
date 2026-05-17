import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ShieldAlert } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseStatus",
  description: "Real-time мониторинг статусов популярных сервисов"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <main className="app-shell">
          <header className="topbar">
            <Link href="/" className="brand" aria-label="PulseStatus">
              <span className="brand-mark">
                <Activity size={19} />
              </span>
              <span>
                <h1 className="brand-title">PulseStatus</h1>
                <p className="brand-subtitle">мониторинг сервисов в реальном времени</p>
              </span>
            </Link>
            <nav className="nav-actions">
              <Link className="ghost-link" href="/">
                <Activity size={16} />
                Мониторинг
              </Link>
              <Link className="ghost-link" href="/admin">
                <ShieldAlert size={16} />
                Админ
              </Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
