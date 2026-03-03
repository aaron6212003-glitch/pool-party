"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/components/PercocoUI'
import { TrendingUp, TrendingDown, Zap, Lock, Trophy, Coins } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Slip {
    id: string
    target_user_id: string
    shift_date: string
    line_type: 'sales' | 'tips'
    line_value: number
    status: string
    memberName?: string
    memberAvatar?: string
    myWager?: { prediction: string; status: string } | null
}

interface SportsbookTabProps {
    groupId: string
    currentUserId: string
    members: any[]
    isAdmin: boolean
    onViewIntel?: (userId: string, name: string, isPrivate: boolean) => void
}

export default function SportsbookTab({ groupId, currentUserId, members, isAdmin, onViewIntel }: SportsbookTabProps) {
    const [slips, setSlips] = useState<Slip[]>([])
    const [bankroll, setBankroll] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [generatingLines, setGeneratingLines] = useState(false)
    const [placingBet, setPlacingBet] = useState<string | null>(null)
    const [lineDate, setLineDate] = useState(new Date().toISOString().split('T')[0])
    const [forceAll, setForceAll] = useState(false)
    const [viewMode, setViewMode] = useState<'lines' | 'history'>('lines')
    const [history, setHistory] = useState<any[]>([])
    const [chipLeaderId, setChipLeaderId] = useState<string | null>(null)
    const supabase = createClient()

    const today = new Date().toISOString().split('T')[0]

    const fetchBankrollAndLeader = useCallback(async () => {
        // Fetch current user bankroll
        const { data } = await supabase
            .from('bankrolls')
            .select('chips')
            .eq('user_id', currentUserId)
            .eq('group_id', groupId)
            .single()

        if (data) {
            setBankroll(data.chips)
        } else {
            // Auto-create initial 100 bankroll
            const { data: created } = await supabase
                .from('bankrolls')
                .insert({ user_id: currentUserId, group_id: groupId, chips: 100 })
                .select('chips')
                .single()
            setBankroll(created?.chips ?? 100)
        }

        // Fetch overall chip leader for the group
        const { data: leaderData } = await supabase
            .from('bankrolls')
            .select('user_id, chips')
            .eq('group_id', groupId)
            .order('chips', { ascending: false })
            .limit(1)
            .single()

        if (leaderData) {
            setChipLeaderId(leaderData.user_id)
        }
    }, [groupId, currentUserId, supabase])

    const fetchSlips = useCallback(async () => {
        setLoading(true)
        const { data: slipData } = await supabase
            .from('slips')
            .select('*')
            .eq('group_id', groupId)
            .eq('shift_date', lineDate)
            .order('created_at', { ascending: true })

        if (!slipData) { setLoading(false); return }

        // Fetch my wagers
        const { data: myWagers } = await supabase
            .from('wagers')
            .select('slip_id, prediction, status')
            .eq('user_id', currentUserId)
            .in('slip_id', slipData.map((s: { id: string }) => s.id))

        const wagerMap = new Map<string, any>(myWagers?.map((w: { slip_id: string; prediction: string; status: string }) => [w.slip_id, w]) || [])

        const enriched: Slip[] = slipData.map((slip: any) => {
            const member = members.find(m => m.user_id === slip.target_user_id)
            return {
                ...slip,
                memberName: member?.display_name || 'Unknown',
                memberAvatar: (member?.profiles as any)?.avatar_url,
                myWager: wagerMap.get(slip.id) || null
            }
        })

        setSlips(enriched)
        setLoading(false)
    }, [groupId, lineDate, currentUserId, members, supabase])

    const fetchWagerHistory = useCallback(async () => {
        const { data } = await supabase
            .from('wagers')
            .select('id, amount, prediction, status, created_at, slips!inner(id, line_type, line_value, shift_date, target_user_id)')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(50)

        setHistory(data || [])
    }, [currentUserId, supabase])

    useEffect(() => {
        fetchBankrollAndLeader()
        fetchSlips()
        fetchWagerHistory()
    }, [fetchBankrollAndLeader, fetchSlips, fetchWagerHistory])

    const handlePlaceBet = async (slipId: string, prediction: 'over' | 'under', amount = 10) => {
        if (bankroll === null || bankroll < amount) {
            toast.error(`Not enough chips! You have ${bankroll ?? 0} chips.`)
            return
        }

        setPlacingBet(slipId)
        try {
            // Deduct chips
            const { error: chipErr } = await supabase
                .from('bankrolls')
                .update({ chips: bankroll - amount })
                .eq('user_id', currentUserId)
                .eq('group_id', groupId)
            if (chipErr) throw chipErr

            // Place wager
            const { error: wagerErr } = await supabase
                .from('wagers')
                .insert({ user_id: currentUserId, slip_id: slipId, prediction, amount })
            if (wagerErr) throw wagerErr

            setBankroll(b => (b ?? 0) - amount)
            toast.success(`Bet placed! ${prediction.toUpperCase()} 🎲`)
            await fetchSlips()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setPlacingBet(null)
        }
    }

    const handleGenerateLines = async () => {
        if (!isAdmin) return
        setGeneratingLines(true)
        try {
            const res = await fetch('/api/sportsbook/generate-lines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_id: groupId, date: lineDate, force: forceAll })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            const count = Array.isArray(data.slips) ? data.slips.length : 0
            if (count === 0) {
                toast.warning('No lines generated — nobody is scheduled on Sling for that date. Try enabling "Force All" to test.')
            } else {
                toast.success(`🎰 Lines live! ${count} server(s) on the board.`)
            }
            await fetchSlips()
        } catch (e: any) {
            toast.error(e.message || 'Failed to generate lines')
        } finally {
            setGeneratingLines(false)
        }
    }

    // Group slips by member
    const slipsByMember = slips.reduce<Record<string, Slip[]>>((acc, slip) => {
        const key = slip.target_user_id
        if (!acc[key]) acc[key] = []
        acc[key].push(slip)
        return acc
    }, {})

    const COMING_SOON = true;

    if (COMING_SOON) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in zoom-in duration-700">
                <div className="relative mb-12 group">
                    {/* Outer glowing pulsing ring */}
                    <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse group-hover:bg-primary/30 transition-all duration-700" />
                    {/* Inner spinning/rotating glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent blur-xl rounded-full animate-[spin_4s_linear_infinite]" />

                    {/* Main Icon container */}
                    <div className="w-28 h-28 relative rounded-full bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
                        {/* Subtle inner animated gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                        <Trophy className="w-12 h-12 text-primary drop-shadow-[0_0_12px_rgba(11,219,37,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                    <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">In Development</span>
                    </div>

                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 font-outfit uppercase tracking-[0.15em]">
                        Sportsbook
                    </h3>

                    <p className="text-sm font-medium text-zinc-400 leading-relaxed">
                        The ultimate betting experience is being polished. Hold onto your chips until the rest of the team arrives!
                    </p>
                </div>

                {/* Decorative chips at the bottom */}
                <div className="mt-16 flex gap-4 opacity-40 grayscale blur-[1px]">
                    <Coins className="w-8 h-8 animate-pulse text-zinc-500" style={{ animationDelay: '0ms' }} />
                    <Coins className="w-6 h-6 animate-pulse text-zinc-500 mt-4" style={{ animationDelay: '500ms' }} />
                    <Coins className="w-8 h-8 animate-pulse text-zinc-500" style={{ animationDelay: '1000ms' }} />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in pb-10">

            {/* Segment Control Lines vs History */}
            <div className="flex bg-zinc-900/60 border border-white/5 rounded-2xl p-1 relative">
                <div className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-primary transition-transform duration-300 ease-in-out",
                    viewMode === 'history' ? "translate-x-full left-[6px]" : "left-1"
                )} />
                <button
                    onClick={() => setViewMode('lines')}
                    className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors",
                        viewMode === 'lines' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Today's Lines
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors",
                        viewMode === 'history' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    My Bets
                </button>
            </div>

            {/* Bankroll Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">{viewMode === 'lines' ? 'Active Lines' : 'Bet History'}</p>
                    {viewMode === 'lines' && (
                        <p className="text-xs text-zinc-500 font-medium">{format(new Date(lineDate + 'T12:00:00'), 'EEEE, MMM d')}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 bg-zinc-900/60 border border-white/10 rounded-2xl px-4 py-2.5">
                    <span className="text-lg">🪙</span>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Bankroll</p>
                        <p className="text-lg font-black text-white font-outfit leading-none">{bankroll ?? '—'}</p>
                    </div>
                </div>
            </div>

            {/* Admin: Generate Lines */}
            {isAdmin && viewMode === 'lines' && (
                <div className="space-y-2 bg-zinc-900/40 border border-white/5 rounded-[2rem] p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Generate Lines</p>
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            value={lineDate}
                            onChange={e => setLineDate(e.target.value)}
                            className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                        />
                    </div>
                    <button
                        onClick={handleGenerateLines}
                        disabled={generatingLines}
                        className="w-full py-3 rounded-2xl border border-primary/30 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/20 active:scale-95 transition-all"
                    >
                        <Zap className="w-4 h-4" />
                        {generatingLines ? 'Generating...' : 'Generate Lines'}
                    </button>
                </div>
            )}

            {/* View Switching */}
            {viewMode === 'lines' ? (
                loading ? (
                    <div className="py-16 text-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : Object.keys(slipsByMember).length === 0 ? (
                    <div className="py-20 text-center space-y-3 bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5">
                        <div className="text-4xl">🎰</div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No lines posted yet</p>
                        {isAdmin && (
                            <p className="text-[9px] text-zinc-700">Tap "Generate Lines" above to post the board.</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(slipsByMember).map(([userId, userSlips]) => {
                            const memberName = userSlips[0].memberName
                            const memberAvatar = userSlips[0].memberAvatar
                            const isMe = userId === currentUserId

                            const isChipLeader = userId === chipLeaderId

                            return (
                                <div key={userId} className={cn(
                                    "rounded-[2rem] border p-5 space-y-4",
                                    isMe ? "border-primary/30 bg-primary/5" : "border-white/5 bg-zinc-900/40"
                                )}>
                                    {/* Member Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                            {memberAvatar ? (
                                                <img src={memberAvatar} alt={memberName} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberName}`} alt={memberName} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-all"
                                                onClick={() => onViewIntel?.(userId, memberName || 'Server', false)}>
                                                <p className="text-sm font-black text-white">{memberName}</p>
                                                {isChipLeader && (
                                                    <div className="bg-yellow-500/20 text-yellow-500 rounded px-1.5 py-0.5 text-[8px] flex items-center gap-1 font-black uppercase tracking-widest">
                                                        👑 Leader
                                                    </div>
                                                )}
                                            </div>
                                            {isMe && <span className="text-[8px] font-black uppercase tracking-widest text-primary">You</span>}
                                        </div>
                                    </div>

                                    {/* Bet Lines */}
                                    {userSlips.map(slip => (
                                        <BetLine
                                            key={slip.id}
                                            slip={slip}
                                            onBet={(prediction) => handlePlaceBet(slip.id, prediction)}
                                            isPlacing={placingBet === slip.id}
                                            bankroll={bankroll ?? 0}
                                        />
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                )
            ) : (
                /* History Tab */
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="py-20 text-center space-y-3 bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5">
                            <div className="text-4xl">📜</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No bets placed yet</p>
                        </div>
                    ) : (
                        history.map(wager => {
                            const slip = wager.slips
                            if (!slip) return null
                            const won = wager.status === 'won'
                            const lost = wager.status === 'lost'
                            const pending = wager.status === 'pending'

                            // Find the target user name from members list
                            const targetMember = members.find(m => m.user_id === slip.target_user_id)
                            const targetName = targetMember?.display_name || 'Server'

                            return (
                                <div key={wager.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                {format(new Date(wager.created_at), 'MMM d, h:mm a')}
                                            </p>
                                            <p className="text-xs font-black text-white">
                                                {slip.line_type === 'sales' ? '💰 Sales' : '🤑 Tips'} • {targetName}
                                            </p>
                                            <p className="text-sm font-black font-outfit text-zinc-400">
                                                Line: ${slip.line_value.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-sm font-black text-white">{wager.amount} 🪙</p>
                                            <div className={cn(
                                                "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest inline-block",
                                                wager.prediction === 'over' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                            )}>
                                                {wager.prediction === 'over' ? '📈 OVER' : '📉 UNDER'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-center",
                                        won ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                            lost ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                "bg-zinc-800 text-zinc-500"
                                    )}>
                                        {won ? '+20 🪙 WON' : lost ? '-10 🪙 LOST' : 'PENDING'}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            <p className="text-center text-[8px] text-zinc-700 font-black uppercase tracking-widest">
                {viewMode === 'lines' ? 'Betting locks at 4:30 PM · 10 chips per bet · Win pays 20' : 'History of all sportsbook wagers'}
            </p>
        </div>
    )
}

function BetLine({ slip, onBet, isPlacing, bankroll }: {
    slip: Slip,
    onBet: (prediction: 'over' | 'under') => void,
    isPlacing: boolean,
    bankroll: number
}) {
    const isLocked = slip.status !== 'open'
    const hasWagered = !!slip.myWager

    const icon = slip.line_type === 'sales' ? '💰' : '🤑'
    const label = slip.line_type === 'sales' ? 'Net Sales' : 'Takehome Tips'

    return (
        <div className="bg-black/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
                        <p className="text-xl font-black text-white font-outfit">${slip.line_value.toLocaleString()}</p>
                    </div>
                </div>
                {isLocked && (
                    <div className="flex items-center gap-1 text-zinc-600">
                        <Lock className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{slip.status}</span>
                    </div>
                )}
                {hasWagered && !isLocked && (
                    <div className={cn(
                        "px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest",
                        slip.myWager?.prediction === 'over' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {slip.myWager?.prediction === 'over' ? '📈 Over' : '📉 Under'}
                    </div>
                )}
            </div>

            {!isLocked && !hasWagered && (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onBet('over')}
                        disabled={isPlacing || bankroll < 10}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 active:scale-95 transition-all disabled:opacity-30"
                    >
                        <TrendingUp className="w-3 h-3" />
                        OVER (10🪙)
                    </button>
                    <button
                        onClick={() => onBet('under')}
                        disabled={isPlacing || bankroll < 10}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-30"
                    >
                        <TrendingDown className="w-3 h-3" />
                        UNDER (10🪙)
                    </button>
                </div>
            )}
        </div>
    )
}
