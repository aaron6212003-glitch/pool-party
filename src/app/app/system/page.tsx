"use client"

import { useState, useEffect } from 'react'
import { Card, Button, Input, SectionTitle, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Shield, Users, Activity, Database, AlertTriangle, RefreshCw, Trash2, Key } from 'lucide-react'

export default function SystemAdminPage() {
    const [stats, setStats] = useState({ users: 0, parties: 0, entries: 0 })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchSystemStats = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            // SECURITY CHECK: This page is only for Aaron or designated system admins
            // For now, we will allow the first user or based on metadata
            if (!user) {
                router.push('/login')
                return
            }

            // In a real app, you would check a specific UUID or a system_admin role
            // Since we are in development, we'll allow it if the user has the right name/email
            const isAaron = user.email?.includes('aaron') || user.user_metadata?.full_name?.includes('Aaron')
            if (!isAaron && !user.user_metadata?.is_system_admin) {
                toast.error("Restricted Access: System Admins only.")
                router.push('/app')
                return
            }

            try {
                // Fetch basic counts
                const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
                const { count: partyCount } = await supabase.from('groups').select('*', { count: 'exact', head: true })
                const { count: entryCount } = await supabase.from('shift_entries').select('*', { count: 'exact', head: true })

                setStats({
                    users: userCount || 0,
                    parties: partyCount || 0,
                    entries: entryCount || 0
                })
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        fetchSystemStats()
    }, [supabase, router])

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh] bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-8 animate-in pb-32 bg-black min-h-screen">
            <header className="space-y-1 mt-4">
                <div className="flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-[0.4em]">
                    <Shield className="w-3 h-3" />
                    System Status
                </div>
                <h1 className="text-4xl font-black font-outfit text-white tracking-tighter">System Admin.</h1>
            </header>

            <div className="grid grid-cols-1 gap-4">
                <Card className="!p-8 bg-zinc-900 border-red-500/20 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black font-outfit text-white leading-none">Global Health</h2>
                            <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest mt-1">Platform-wide statistics</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Agents</p>
                            <p className="text-2xl font-black font-outfit text-white">{stats.users}</p>
                        </div>
                        <div className="p-4 bg-black rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Parties</p>
                            <p className="text-2xl font-black font-outfit text-white">{stats.parties}</p>
                        </div>
                        <div className="p-4 bg-black rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Captured Logs</p>
                            <p className="text-2xl font-black font-outfit text-white">{stats.entries}</p>
                        </div>
                        <div className="p-4 bg-black rounded-2xl border border-white/5 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-zinc-700 hover:text-white transition-colors cursor-pointer" />
                        </div>
                    </div>
                </Card>

                <Card className="!p-8 bg-zinc-900 border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black font-outfit text-white leading-none">Infrastructure</h2>
                            <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest mt-1">Database maintenance</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button variant="secondary" className="w-full py-4 text-[10px] font-black uppercase tracking-widest gap-2">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Force Cache Purge
                        </Button>
                        <Button variant="danger" className="w-full py-4 text-[10px] font-black uppercase tracking-widest gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Purge All Test Tables
                        </Button>
                    </div>
                </Card>

                <Card className="!p-8 bg-zinc-900 border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black font-outfit text-white leading-none">Access Control</h2>
                            <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest mt-1">Manage global permissions</p>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                        <p className="text-[9px] text-amber-500/80 font-bold leading-relaxed italic">
                            Wait for "Super Admin" designation to enable user permission modifying algorithms.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
