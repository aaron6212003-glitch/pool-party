"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusSquare, History, Users, Settings } from 'lucide-react'
import { cn } from '@/components/PercocoUI'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AnimatedSplash from '@/components/AnimatedSplash'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [hasUnread, setHasUnread] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        let mounted = true
        let channel: any = null

        const checkUnread = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const lastRead = localStorage.getItem('percoco_last_read_all') || new Date(0).toISOString()

            const { data: memberships } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id)

            if (!memberships || memberships.length === 0) return
            const groupIds = memberships.map((m: any) => m.group_id)

            const { count } = await supabase
                .from('party_feed')
                .select('*', { count: 'exact', head: true })
                .in('group_id', groupIds)
                .gt('created_at', lastRead)

            if (mounted) setHasUnread((count || 0) > 0)

            channel = supabase.channel('global-feed-dots')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'party_feed'
                }, (payload: any) => {
                    if (groupIds.includes(payload.new.group_id)) {
                        if (mounted) setHasUnread(true)
                    }
                })
                .subscribe()
        }

        checkUnread()
        const handleRead = () => setHasUnread(false)
        window.addEventListener('percoco_feed_read', handleRead)

        return () => {
            mounted = false
            if (channel) supabase.removeChannel(channel)
            window.removeEventListener('percoco_feed_read', handleRead)
        }
    }, [])

    const tabs = [
        { label: 'Home', icon: Home, href: '/app' },
        { label: 'History', icon: History, href: '/app/history' },
        { label: 'New', icon: PlusSquare, href: '/app/new', center: true },
        { label: 'Parties', icon: Users, href: '/app/groups', hasDot: hasUnread },
        { label: 'Settings', icon: Settings, href: '/app/settings' },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-[var(--background)]">
            <AnimatedSplash />
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
                            "flex flex-col items-center gap-1 transition-colors relative",
                            isActive ? "text-primary" : "text-[var(--muted-foreground)]"
                        )}>
                            <div className="relative">
                                <Icon className={cn("w-6 h-6", isActive && "fill-primary/10")} />
                                {(tab as any).hasDot && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--card)] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                )}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tight">{tab.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
