"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusSquare, History, Users, Settings } from 'lucide-react'
import { cn } from '@/components/PercocoUI'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const tabs = [
        { label: 'Home', icon: Home, href: '/app' },
        { label: 'History', icon: History, href: '/app/history' },
        { label: 'New', icon: PlusSquare, href: '/app/new', center: true },
        { label: 'Parties', icon: Users, href: '/app/groups' },
        { label: 'Settings', icon: Settings, href: '/app/settings' },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-[var(--background)]">
            <div className="flex-1 pb-24 overflow-y-auto w-full">
                {children}
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--card)]/80 backdrop-blur-xl border-t border-[var(--border)] px-6 py-4 flex justify-between items-center z-50">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || (tab.href !== '/app' && pathname.startsWith(tab.href))
                    const Icon = tab.icon

                    if (tab.center) {
                        return (
                            <Link key={tab.href} href={tab.href} className="relative -top-8 bg-primary w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform ring-4 ring-[var(--background)]">
                                <Icon className="w-7 h-7" />
                            </Link>
                        )
                    }

                    return (
                        <Link key={tab.href} href={tab.href} className={cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            isActive ? "text-primary" : "text-[var(--muted-foreground)]"
                        )}>
                            <Icon className={cn("w-6 h-6", isActive && "fill-primary/10")} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{tab.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
