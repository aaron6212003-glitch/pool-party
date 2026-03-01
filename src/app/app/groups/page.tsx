"use client"

import { useState, useEffect } from 'react'
import { Card, Button, Input, SectionTitle, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Trophy, ChevronRight, Hash, UsersRound, MapPin, Search, ArrowRight, Sparkles } from 'lucide-react'

export default function GroupsPage() {
    const [inviteInput, setInviteInput] = useState('')
    const [newGroupName, setNewGroupName] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [loading, setLoading] = useState(false)
    const [groups, setGroups] = useState<any[]>([])
    const [fetchLoading, setFetchLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

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
                        invite_code
                    )
                `)
                .eq('user_id', user.id)

            if (!error && data) {
                setGroups(data.map((item: any) => item.groups).filter(Boolean))
            }
            setFetchLoading(false)
        }
        fetchGroups()
    }, [])

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteInput) return toast.error("Please enter an invite link or code")

        // Extract code if it's a link
        const code = inviteInput.includes('/join/')
            ? inviteInput.split('/join/').pop()?.split('/')[0]
            : inviteInput.trim()

        if (!code) return toast.error("Invalid invite format")

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not logged in")

            const { data: group, error: fetchError } = await supabase
                .from('groups')
                .select('*')
                .eq('invite_code', code)
                .single()

            if (fetchError || !group) throw new Error("Invalid invite link/code")

            const { error: joinError } = await supabase.from('group_members').insert({
                group_id: group.id,
                user_id: user.id,
                display_name: user?.user_metadata?.full_name ?? 'Server',
            })

            if (joinError) {
                if (joinError.code === '23505') throw new Error("You are already in this group!")
                throw joinError
            }

            toast.success(`Welcome to the party! Joined ${group.name}`)
            router.push(`/app/groups/${group.id}`)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
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

            // Generate a random 6-character code
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

            toast.success(`Party created: ${group.name}!`)
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
        <div className="p-6 space-y-8 animate-in pb-32 bg-black min-h-screen">
            <header className="flex justify-between items-start mt-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Crowd Control</p>
                    <h1 className="text-3xl font-black font-outfit text-white tracking-tighter">Your Parties.</h1>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-primary border border-white/5 shadow-xl">
                    <UsersRound className="w-6 h-6" />
                </div>
            </header>

            {/* Join or Create Toggle */}
            <section className="space-y-4">
                <Card className="!p-10 shadow-3xl border-white/5 bg-zinc-900/40 relative overflow-hidden rounded-[2.5rem] border-t-primary/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Sparkles className="w-24 h-24 text-primary" />
                    </div>

                    <div className="flex gap-8 mb-10 border-b border-white/5 pb-1">
                        <button
                            onClick={() => setShowCreate(false)}
                            className={cn(
                                "pb-3 text-xs font-black uppercase tracking-[0.3em] transition-all relative",
                                !showCreate ? "text-primary" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            Find a Party
                            {!showCreate && <motion.div layoutId="tab" className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className={cn(
                                "pb-3 text-xs font-black uppercase tracking-[0.3em] transition-all relative",
                                showCreate ? "text-primary" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            Start New
                            {showCreate && <motion.div layoutId="tab" className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {showCreate ? (
                            <motion.form
                                key="create"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onSubmit={handleCreateGroup}
                                className="space-y-6"
                            >
                                <Input
                                    label="Party Nickname"
                                    placeholder="e.g. Percoco's Lakewood"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="text-lg py-5 bg-black"
                                />
                                <div className="pt-2">
                                    <Button type="submit" className="w-full py-6 text-xl rounded-2xl shadow-xl shadow-primary/20" disabled={loading}>
                                        {loading ? "Establishing..." : "Connect Party 🎉"}
                                    </Button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="join"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleJoin}
                                className="space-y-6"
                            >
                                <div className="relative group">
                                    <Input
                                        label="Secret Invite Code"
                                        placeholder="Paste Code or Link"
                                        value={inviteInput}
                                        onChange={(e) => setInviteInput(e.target.value)}
                                        className="text-lg py-5 bg-black pr-24"
                                    />
                                    <div className="absolute right-2 bottom-2">
                                        <Button type="submit" className="px-6 py-4 rounded-xl bg-primary text-white shadow-xl" disabled={loading}>
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center opacity-60 italic">Ask your manager for the team code.</p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </Card>
            </section>

            {/* My Teams */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-lg text-white tracking-tight leading-none">Joined Parties</h2>
                    <Badge className="bg-zinc-900 text-zinc-600 border-none">{groups.length} Groups</Badge>
                </div>

                <div className="space-y-4">
                    {groups.length > 0 ? (
                        groups.map((group) => (
                            <Card key={group.id} className="p-0 overflow-hidden relative border-l-4 border-primary bg-zinc-900/60 shadow-xl active:scale-[0.98] transition-all cursor-pointer group rounded-2xl" onClick={() => router.push(`/app/groups/${group.id}`)}>
                                <div className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black font-outfit text-white tracking-tighter capitalize">{group.name}</h3>
                                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest opacity-60">
                                            <Hash className="w-3 h-3" />
                                            Code: {group.invite_code}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="py-16 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5">
                            <Users className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-600">You aren't in any parties yet.</p>
                            <button onClick={() => setShowCreate(true)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary">Create the first one →</button>
                        </div>
                    )}
                </div>
            </section>

            {/* Pro Tip Card */}
            <Card className="!p-8 bg-primary/10 border-primary/20 rounded-[2rem] text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Pro Tip</p>
                <p className="text-sm font-bold text-white font-outfit max-w-[80%] mx-auto">Click "Start New" to create a private group for your restaurant staff and compete for high scores!</p>
            </Card>
        </div>
    )
}
