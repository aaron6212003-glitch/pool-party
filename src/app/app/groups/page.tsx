"use client"

import { useState, useEffect } from 'react'
import { Card, Button, Input, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, Hash, UsersRound, ArrowRight, Sparkles, PartyPopper, Globe, ShieldCheck, Zap } from 'lucide-react'
import { startOfWeek, endOfWeek } from 'date-fns'

export default function PartiesPage() {
    const [inviteInput, setInviteInput] = useState('')
    const [newGroupName, setNewGroupName] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [loading, setLoading] = useState(false)
    const [groups, setGroups] = useState<any[]>([])
    // Map of groupId -> number of shifts logged this week
    const [activeMap, setActiveMap] = useState<Record<string, number>>({})
    const [fetchLoading, setFetchLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const joinCode = params.get('join') || params.get('code')
        if (joinCode) {
            setInviteInput(joinCode)
            setShowCreate(false)
        }
    }, [])

    useEffect(() => {
        const fetchGroups = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    groups (
                        id,
                        name,
                        invite_code,
                        owner_id
                    )
                `)
                .eq('user_id', user.id)

            if (!error && data) {
                const extracted = data.map((item: any) => item.groups).filter(Boolean)
                setGroups(extracted)

                if (extracted.length > 0) {
                    const params = new URLSearchParams(window.location.search)
                    if (!params.has('list') && !params.has('join') && !params.has('code')) {
                        router.replace(`/app/groups/${extracted[0].id}`)
                        return
                    }

                    // Fetch this week's shift counts per group to determine activity
                    const startValue = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
                    const endValue = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
                    const groupIds = extracted.map((g: any) => g.id)
                    const { data: shifts } = await supabase
                        .from('shift_entries')
                        .select('group_id')
                        .in('group_id', groupIds)
                        .gte('date', startValue)
                        .lte('date', endValue)

                    if (shifts) {
                        const map: Record<string, number> = {}
                        shifts.forEach((s: any) => {
                            map[s.group_id] = (map[s.group_id] || 0) + 1
                        })
                        setActiveMap(map)
                    }
                }
            }
            setFetchLoading(false)
        }
        fetchGroups()
    }, [])

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteInput) return toast.error("Please enter an invite link or code")

        const code = inviteInput.includes('/join/')
            ? inviteInput.split('/join/').pop()?.split('/')[0]
            : inviteInput.trim()

        if (!code) return toast.error("Invalid invite format")

        setLoading(true)
        try {
            // Use the NEW secure RPC instead of client-side select/insert
            const { data, error } = await supabase.rpc('join_party_by_code', {
                invite_code_input: code.toUpperCase()
            })

            if (error) throw error
            if (!data.success) throw new Error(data.error)

            toast.success(`Welcome to the party: ${data.group_name}`)
            router.push(`/app/groups/${data.group_id}`)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroupName) return toast.error("Please name your party")

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not logged in")

            const code = Math.random().toString(36).substring(2, 8).toUpperCase()

            const { data: group, error: createError } = await supabase
                .from('groups')
                .insert({
                    name: newGroupName,
                    invite_code: code,
                    owner_id: user.id,
                    settings: { supportPct: 0.05, enabledTipouts: [], timezone: "UTC" }
                })
                .select()
                .single()

            if (createError) throw createError

            const { error: joinError } = await supabase.from('group_members').insert({
                group_id: group.id,
                user_id: user.id,
                display_name: user?.user_metadata?.full_name ?? 'Server',
                is_admin: true
            })

            if (joinError) throw joinError

            toast.success(`Party established: ${group.name}`)
            setShowCreate(false)
            setNewGroupName('')
            router.push(`/app/groups/${group.id}`)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (fetchLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh] bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-0 animate-in pb-40 bg-black min-h-screen">
            {/* HEADER */}
            <section className="bg-gradient-to-b from-indigo-600/20 via-primary/10 to-transparent p-6 pt-12 pb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 bg-primary/30 blur-[100px] rounded-full w-80 h-80 -mr-40 -mt-40"></div>
                <div className="relative z-10 flex flex-col gap-6">
                    <header className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.4em]">
                                <Globe className="w-3 h-3" />
                                Workforce OS
                            </div>
                            <h1 className="text-4xl font-black font-outfit text-white tracking-tighter">Your Parties.</h1>
                        </div>
                        <div className="w-14 h-14 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-primary shadow-2xl">
                            <PartyPopper className="w-7 h-7" />
                        </div>
                    </header>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Memberships</p>
                            <p className="text-2xl font-black font-outfit text-white leading-none">{groups.length}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Active This Week</p>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-emerald-400" />
                                <p className="text-2xl font-black font-outfit text-white leading-none">
                                    {Object.values(activeMap).filter(v => v > 0).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* GROUP CARDS */}
            <section className="px-6 -mt-8 space-y-6 relative z-10">
                <div className="space-y-4">
                    {groups.length > 0 ? (
                        <div className="grid gap-4">
                            {groups.map((group, i) => {
                                const shiftCount = activeMap[group.id] || 0
                                const isActive = shiftCount > 0

                                return (
                                    <motion.div
                                        key={group.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Card
                                            className={cn(
                                                "p-0 overflow-hidden relative backdrop-blur-xl shadow-3xl active:scale-[0.98] transition-all cursor-pointer group rounded-3xl border",
                                                isActive
                                                    ? "bg-emerald-950/40 border-emerald-500/30"
                                                    : "bg-zinc-900/80 border-white/5"
                                            )}
                                            onClick={() => router.push(`/app/groups/${group.id}`)}
                                        >
                                            {/* Active glow */}
                                            {isActive && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/8 to-transparent pointer-events-none" />
                                            )}
                                            {!isActive && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                                            )}

                                            {/* Active pulse indicator top-left */}
                                            {isActive && (
                                                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                </div>
                                            )}

                                            <div className="p-6 flex items-center justify-between relative z-10">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <h2 className={cn(
                                                            "text-2xl font-black font-outfit tracking-tighter capitalize leading-none",
                                                            isActive ? "text-emerald-50" : "text-white"
                                                        )}>{group.name}</h2>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-80 px-3 py-1.5 rounded-full ring-1",
                                                            isActive
                                                                ? "text-emerald-400 bg-emerald-950/60 ring-emerald-500/20"
                                                                : "text-zinc-500 bg-black/40 ring-white/5"
                                                        )}>
                                                            <Hash className={cn("w-3 h-3", isActive ? "text-emerald-400" : "text-primary")} />
                                                            {group.invite_code}
                                                        </div>
                                                        {isActive && (
                                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[8px] !px-2 !py-0.5 font-black">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-xl shrink-0 ml-3",
                                                    isActive
                                                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                                                        : "bg-black border-white/10 text-primary group-hover:bg-primary group-hover:text-white"
                                                )}>
                                                    <ArrowRight className="w-6 h-6" />
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-zinc-900/40 rounded-[3rem] border border-dashed border-white/5 backdrop-blur-xl">
                            <UsersRound className="w-16 h-16 mx-auto mb-6 text-zinc-800 opacity-50" />
                            <h3 className="text-2xl font-black font-outfit text-white tracking-tighter mb-2">Lone Wolf Syndrome.</h3>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest max-w-[80%] mx-auto leading-relaxed">You aren't in any parties yet. Scan an invite code or start your own empire below.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* JOIN / CREATE */}
            <section className="p-6 pt-12 space-y-6">
                <div className="px-1 space-y-1">
                    <h2 className="font-black font-outfit text-2xl text-white tracking-tighter">Join or Create a Party.</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 opacity-80">Join an existing party or create your own</p>
                </div>

                <Card className="!p-10 shadow-3xl border-white/5 bg-zinc-900/40 relative overflow-hidden rounded-[3rem] border-t-primary/10 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                        <Sparkles className="w-32 h-32 text-primary" />
                    </div>

                    <div className="flex gap-1 bg-black p-1.5 rounded-2xl mb-10 ring-1 ring-white/5">
                        <button
                            onClick={() => setShowCreate(false)}
                            className={cn(
                                "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-xl",
                                !showCreate ? "bg-zinc-800 text-primary shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            Join
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className={cn(
                                "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-xl",
                                showCreate ? "bg-zinc-800 text-primary shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            Create
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {showCreate ? (
                            <motion.form
                                key="create"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleCreateGroup}
                                className="space-y-8"
                            >
                                <Input
                                    label="Party Name"
                                    placeholder="e.g. Percoco's LWR"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="text-lg py-5 bg-black border-white/5 rounded-2xl"
                                />
                                <Button type="submit" className="w-full py-6 text-xl rounded-2xl shadow-2xl shadow-primary/20 flex items-center justify-center gap-3" disabled={loading}>
                                    <Plus className="w-6 h-6" />
                                    {loading ? "Creating..." : "Create Party"}
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="join"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleJoin}
                                className="space-y-8"
                            >
                                <div className="relative group">
                                    <Input
                                        label="Invite Code or Link"
                                        placeholder="Paste Code or Link"
                                        value={inviteInput}
                                        onChange={(e) => setInviteInput(e.target.value)}
                                        className="text-lg py-5 bg-black border-white/5 rounded-2xl pr-24"
                                    />
                                    <div className="absolute right-2 bottom-2">
                                        <Button type="submit" className="px-6 py-4 rounded-xl bg-primary text-white shadow-xl" disabled={loading}>
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] leading-relaxed italic text-center">
                                        Paste the invite link or code you received from your party admin.
                                    </p>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </Card>
            </section>
        </div>
    )
}
