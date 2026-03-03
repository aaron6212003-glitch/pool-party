"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Modal, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trophy, Settings, BarChart3, Crown, UsersRound, DollarSign, Wallet, RefreshCcw, Calendar, ArrowUpRight, ChevronLeft, ChevronRight, EyeOff, ShieldAlert, Hash, Pencil, Check, X, Trash2, User, UserMinus, Instagram } from 'lucide-react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { calculateShiftGrade } from '@/lib/calculations'
import SportsbookTab from '@/components/SportsbookTab'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Leaderboard Item ────────────────────────────────────────────────────────
function LeaderboardItem({ name, value, rank, type, avatar, isAdmin: itemIsAdmin, isPrivate, onClick }: {
    name: string
    value: string
    rank: number
    type: string
    avatar?: string
    isAdmin?: boolean
    isPrivate?: boolean
    onClick?: () => void
}) {
    const isTopThree = rank <= 3 && !isPrivate
    const rankColors = ['bg-[#FFD700]', 'bg-[#C0C0C0]', 'bg-[#CD7F32]']

    return (
        <Card
            className={cn(
                'p-5 py-4 flex items-center justify-between border-none shadow-2xl group active:scale-[0.98] transition-all rounded-2xl cursor-pointer relative overflow-hidden',
                isPrivate ? 'bg-zinc-900/20 opacity-50' : 'bg-zinc-900/60',
            )}
            onClick={onClick}
        >
            {/* The Animated Crown Takeover Effect (Conic Gradient) */}
            {rank === 1 && !isPrivate && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#FFD700_100%)] opacity-20" />
                    <div className="absolute inset-[1px] bg-zinc-900 rounded-2xl" />
                </div>
            )}
            <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-black font-outfit text-xs shadow-sm shrink-0',
                    isTopThree ? rankColors[rank - 1] + ' text-black' : 'bg-black text-zinc-500'
                )}>
                    {rank}
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black overflow-hidden ring-2 ring-primary/5 shrink-0">
                        {isPrivate
                            ? <div className="w-full h-full flex items-center justify-center bg-zinc-900"><EyeOff className="w-4 h-4 text-zinc-700" /></div>
                            : <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt="Avatar" className="w-full h-full object-cover" />
                        }
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="font-black font-outfit text-sm tracking-tight text-white">{name}</p>
                            {itemIsAdmin && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                        </div>
                        <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest opacity-60">
                            {isPrivate ? 'Stats private' : type}
                        </p>
                    </div>
                </div>
            </div>
            <div className="text-right relative z-10">
                {isPrivate ? (
                    <p className="font-black font-outfit text-sm tracking-widest text-zinc-700 uppercase">Hidden</p>
                ) : (
                    <>
                        <p className={cn("font-black font-outfit text-xl tracking-tighter", rank === 1 ? 'text-[#FFD700]' : 'text-white')}>{value}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                            <ArrowUpRight className="w-2.5 h-2.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[8px] font-black text-primary uppercase tracking-tighter">View</span>
                        </div>
                    </>
                )}
            </div>
        </Card>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PartyDetails() {
    const { id } = useParams()
    const router = useRouter()
    const supabase = createClient()

    const [activeTab, setActiveTab] = useState('leaderboard')
    const [sortMetric, setSortMetric] = useState<'sales' | 'tips'>('sales')
    const [group, setGroup] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [rawShifts, setRawShifts] = useState<any[]>([])
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [kickingId, setKickingId] = useState<string | null>(null)
    const [weekOffset, setWeekOffset] = useState(0)
    const [timeframe, setTimeframe] = useState<'week' | 'all-time'>('week')
    const [selectedUserIntel, setSelectedUserIntel] = useState<any>(null)
    const [editingCode, setEditingCode] = useState(false)
    const [newCode, setNewCode] = useState('')
    const [savingCode, setSavingCode] = useState(false)
    const [feedItems, setFeedItems] = useState<any[]>([])
    const [chatInput, setChatInput] = useState('')
    const [isAnonymousPost, setIsAnonymousPost] = useState(false)
    const [postingChat, setPostingChat] = useState(false)
    const longPressRefs = useRef<Record<string, NodeJS.Timeout>>({})
    const [activeReactionPopup, setActiveReactionPopup] = useState<string | null>(null)
    const [intelTab, setIntelTab] = useState<'shifts' | 'profile'>('profile')
    const [profileForm, setProfileForm] = useState<any>({
        display_name: '',
        avatar_url: '',
        birthday: '',
        work_anniversary: '',
        bio: '',
        share_to_leaderboard: true
    })
    const [savingProfile, setSavingProfile] = useState(false)

    const selectedWeekStart = startOfWeek(subWeeks(new Date(), -weekOffset), { weekStartsOn: 1 })
    const selectedWeekEnd = endOfWeek(subWeeks(new Date(), -weekOffset), { weekStartsOn: 1 })
    const isCurrentWeek = weekOffset === 0

    const fetchGroupData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setCurrentUserId(user.id)

        const { data: groupData, error: groupError } = await supabase
            .from('groups').select('*').eq('id', id).single()
        if (groupError) { toast.error('Could not find this party'); router.push('/app/groups'); return }
        setGroup(groupData)
        const { data: memberData } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', id)

        if (memberData && memberData.length > 0) {
            const userIds = memberData.map((m: any) => m.user_id)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, avatar_url, share_to_leaderboard, birthday, work_anniversary, bio')
                .in('id', userIds)

            const enrichedMembers = memberData.map((m: any) => ({
                ...m,
                profiles: profileData?.find((p: any) => p.id === m.user_id) || null
            }))

            setMembers(enrichedMembers)
        } else {
            setMembers([])
        }

        setLoading(false)
        setRefreshing(false)
    }, [id, supabase, router])

    const fetchShiftsForWeek = useCallback(async () => {
        let query = supabase
            .from('shift_entries')
            .select('user_id, net_sales, tips, computed_data, date')
            .eq('group_id', id)

        if (timeframe === 'week') {
            const start = startOfWeek(subWeeks(new Date(), -weekOffset), { weekStartsOn: 1 }).toISOString().split('T')[0]
            const end = endOfWeek(subWeeks(new Date(), -weekOffset), { weekStartsOn: 1 }).toISOString().split('T')[0]
            query = query.gte('date', start).lte('date', end)
        }

        const { data: shifts } = await query
        if (shifts) setRawShifts(shifts)
    }, [id, supabase, weekOffset, timeframe])

    const fetchFeed = useCallback(async () => {
        const { data } = await supabase
            .from('party_feed')
            .select(`
                id, event_type, content, metadata, is_anonymous, created_at, user_id
            `)
            .eq('group_id', id)
            .order('created_at', { ascending: false })
            .limit(150)
        if (data) setFeedItems(data)
    }, [id, supabase])

    // Run both fetches together so the leaderboard always has fresh opt-in status + shift data
    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await Promise.all([fetchGroupData(true), fetchShiftsForWeek(), fetchFeed()])
        setRefreshing(false)
    }, [fetchGroupData, fetchShiftsForWeek, fetchFeed])

    useEffect(() => {
        fetchGroupData()
        fetchShiftsForWeek()
        fetchFeed()
        const handleFocus = () => handleRefresh()
        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [fetchGroupData, fetchShiftsForWeek, fetchFeed, handleRefresh])

    useEffect(() => {
        const handlePopState = () => {
            if (activeTab === 'feed' && window.location.hash !== '#feed') {
                setActiveTab('leaderboard')
            }
        }
        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [activeTab])

    useEffect(() => {
        // Set up real-time subscription for the feed
        const channel = supabase
            .channel('party_feed_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'party_feed', filter: `group_id=eq.${id}` }, () => fetchFeed())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'party_feed', filter: `group_id=eq.${id}` }, () => fetchFeed())
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'party_feed', filter: `group_id=eq.${id}` }, () => fetchFeed())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id, supabase, fetchFeed])

    useEffect(() => { fetchShiftsForWeek() }, [fetchShiftsForWeek])

    useEffect(() => {
        if (members.length === 0) return
        const board = members.map(m => {
            const userShifts = rawShifts.filter(s => s.user_id === m.user_id)
            const totalSales = userShifts.reduce((acc, s) => acc + parseFloat(s.net_sales || 0), 0)
            const totalTips = userShifts.reduce((acc, s) => {
                const cc = parseFloat(s.tips || 0)
                const cash = parseFloat(s.computed_data?.cashTips || 0)
                const wage = parseFloat(s.computed_data?.wageEarnings || 0)
                return acc + cc + cash + wage
            }, 0)
            // Read share_to_leaderboard from profiles join — that's what settings writes to
            const profileData = m.profiles as any
            const isPrivate = profileData?.share_to_leaderboard === false
            return {
                id: m.user_id,
                name: m.display_name,
                sales: totalSales,
                tips: totalTips,
                avatar: profileData?.avatar_url,
                isAdmin: m.user_id === group?.owner_id,
                isPrivate,
            }
        })
        board.sort((a, b) => {
            if (a.isPrivate && !b.isPrivate) return 1
            if (!a.isPrivate && b.isPrivate) return -1
            return sortMetric === 'sales' ? b.sales - a.sales : b.tips - a.tips
        })
        setLeaderboard(board)
    }, [rawShifts, members, sortMetric, group])

    useEffect(() => {
        if (currentUserId && members.length > 0) {
            const myMember = members.find(m => m.user_id === currentUserId)
            if (myMember?.profiles) {
                setProfileForm({
                    display_name: myMember.display_name || '',
                    avatar_url: myMember.profiles.avatar_url || '',
                    birthday: myMember.profiles.birthday || '',
                    work_anniversary: myMember.profiles.work_anniversary || '',
                    bio: myMember.profiles.bio || '',
                    share_to_leaderboard: myMember.profiles.share_to_leaderboard ?? true
                })
            }
        }
    }, [currentUserId, members])

    const handleSaveProfile = async () => {
        if (!currentUserId) return
        setSavingProfile(true)
        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: profileForm.avatar_url,
                    birthday: profileForm.birthday,
                    work_anniversary: profileForm.work_anniversary,
                    bio: profileForm.bio,
                    share_to_leaderboard: profileForm.share_to_leaderboard
                })
                .eq('id', currentUserId)

            if (profileError) throw profileError

            const { error: memberError } = await supabase
                .from('group_members')
                .update({ display_name: profileForm.display_name })
                .eq('group_id', id)
                .eq('user_id', currentUserId)

            if (memberError) throw memberError

            toast.success('Profile updated!')
            fetchGroupData()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSavingProfile(false)
        }
    }

    const handleViewIntel = async (userId: string, name: string, isPrivate: boolean) => {
        setIntelTab('profile')
        const memberMatch = members.find(m => m.user_id === userId)
        const profile = memberMatch?.profiles || {}

        if (isPrivate) {
            setSelectedUserIntel({ userId, name, shifts: [], isPrivate: true, profile })
            return
        }
        const start = selectedWeekStart.toISOString().split('T')[0]
        const end = selectedWeekEnd.toISOString().split('T')[0]
        const { data: userShifts } = await supabase
            .from('shift_entries')
            .select('*')
            .eq('group_id', id)
            .eq('user_id', userId)
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: false })
        setSelectedUserIntel({ userId, name, shifts: userShifts || [], isPrivate: false, profile })
    }

    const handleKickMember = async (userId: string) => {
        if (!confirm('Remove this member from the party?')) return
        setKickingId(userId)
        try {
            const { error } = await supabase.from('group_members').delete().eq('group_id', id).eq('user_id', userId)
            if (error) throw error
            toast.success('Member removed.')
            setMembers(prev => prev.filter(m => m.user_id !== userId))
            setSelectedUserIntel(null)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setKickingId(null)
        }
    }

    const handleUpdateCode = async () => {
        const clean = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (clean.length < 4 || clean.length > 6) { toast.error('Code must be 4–6 letters or numbers'); return }
        setSavingCode(true)
        try {
            const { data: existing } = await supabase.from('groups').select('id').eq('invite_code', clean).neq('id', id).maybeSingle()
            if (existing) { toast.error('That code is already in use — try another'); return }
            const { error } = await supabase.from('groups').update({ invite_code: clean }).eq('id', id)
            if (error) throw error
            setGroup((prev: any) => ({ ...prev, invite_code: clean }))
            setEditingCode(false)
            toast.success(`Invite code updated to ${clean}`)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSavingCode(false)
        }
    }

    const handleDeleteFeedItem = async (itemId: string, itemUserId: string) => {
        if (itemUserId !== currentUserId) return
        if (!confirm('Delete this message? This cannot be undone.')) return
        const { error } = await supabase.from('party_feed').delete().eq('id', itemId)
        if (error) {
            toast.error('Could not delete message')
        } else {
            setFeedItems(prev => prev.filter(i => i.id !== itemId))
        }
    }

    const handleReaction = async (itemId: string, emoji: string) => {
        if (!currentUserId) return

        const existingReactionItem = feedItems.find(i =>
            i.metadata?.type === 'reaction' &&
            i.metadata?.target_id === itemId &&
            i.metadata?.emoji === emoji &&
            i.user_id === currentUserId
        )

        setActiveReactionPopup(null)

        if (existingReactionItem) {
            // Optimistic delete
            setFeedItems(prev => prev.filter(i => i.id !== existingReactionItem.id))
            const { error } = await supabase.from('party_feed').delete().eq('id', existingReactionItem.id)
            if (error) {
                toast.error('Failed to remove reaction')
                fetchFeed()
            } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10)
            }
        } else {
            // Optimistic insert
            const tempId = crypto.randomUUID()
            const payload = {
                id: tempId,
                group_id: id as string,
                user_id: currentUserId,
                event_type: 'chat',
                content: `reaction:${emoji}`,
                metadata: { type: 'reaction', target_id: itemId, emoji },
                created_at: new Date().toISOString()
            }
            setFeedItems(prev => [payload, ...prev])

            const { error } = await supabase.from('party_feed').insert({
                id: payload.id,
                group_id: payload.group_id,
                user_id: payload.user_id,
                event_type: payload.event_type as any,
                content: payload.content,
                metadata: payload.metadata
            })

            if (error) {
                toast.error('Failed to add reaction')
                fetchFeed()
            } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10)
            }
        }
    }

    const handlePostChat = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim() || !currentUserId) return

        setPostingChat(true)
        const tempId = crypto.randomUUID()
        const payload = {
            id: tempId,
            group_id: id as string,
            user_id: currentUserId,
            event_type: 'chat' as const,
            content: chatInput.trim(),
            metadata: {},
            is_anonymous: isAnonymousPost
        }

        console.log("Sending chat...", payload)

        // Optimistic UI update
        const tempInput = chatInput
        setChatInput('')
        const userProfile = members.find(m => m.user_id === currentUserId)?.profiles

        setFeedItems(prev => [{
            ...payload,
            created_at: new Date().toISOString(),
            profiles: userProfile
        }, ...prev])

        const { error } = await supabase.from('party_feed').insert(payload)
        setPostingChat(false)
        if (error) {
            console.error("Supabase Chat Error:", error)
            toast.error(error.message || "Failed to post message")
            // Revert optimistic update
            setFeedItems(prev => prev.filter(i => i.id !== tempId))
            setChatInput(tempInput)
        } else {
            fetchFeed()
        }
    }

    if (loading || !group) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4 px-8">
                <div className="w-full max-w-sm h-64 bg-zinc-900/40 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                </div>
                <div className="w-full max-w-sm h-20 bg-zinc-900/40 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                </div>
            </div>
        )
    }

    const isAdmin = group?.owner_id === currentUserId

    return (
        <div className="p-0 animate-in pb-32 bg-black min-h-screen">

            {/* Party Header */}
            <section className="bg-gradient-to-b from-zinc-900 to-black p-8 pt-16 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 bg-primary/20 blur-3xl rounded-full w-80 h-80 -mr-40 -mt-40" />
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-[0.4em]">
                            <button onClick={() => router.push('/app/groups?list=true')} className="-ml-2 p-2 rounded-xl text-primary/70 hover:text-primary hover:bg-white/5 transition-all">
                                <ChevronLeft className="w-5 h-5 mx-[-6px]" />
                            </button>
                            <UsersRound className="w-3 h-3" />
                            Party Headquarters
                        </div>
                        <button
                            onClick={() => handleRefresh()}
                            className={cn('p-2 rounded-full bg-white/5 text-zinc-500 hover:text-white transition-all', refreshing && 'animate-spin text-primary')}
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>
                    <h1 className="text-4xl font-black font-outfit max-w-[90%] leading-[0.9] text-white tracking-tighter capitalize">{group?.name || 'Party Hub'}</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 overflow-hidden">
                            {members.slice(0, 5).map((m, i) => (
                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-zinc-900 overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-primary/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img src={(m.profiles as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.display_name}`} alt="member" className="w-full h-full object-cover relative z-10" />
                                </div>
                            ))}
                        </div>
                        <Badge className="bg-white/5 text-zinc-500 backdrop-blur-md border border-white/5 !py-1.5 !px-3 font-black text-[9px] uppercase tracking-widest">{members.length} Members</Badge>
                        {isAdmin && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20 !py-1.5 !px-3 font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
                                <Crown className="w-3 h-3 fill-yellow-400" /> Admin
                            </Badge>
                        )}
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <div className="px-6 -mt-8 relative z-20">
                <div className="p-1.5 flex gap-1.5 bg-zinc-900/90 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl">
                    {[
                        { id: 'leaderboard', icon: Trophy, label: 'Stats' },
                        { id: 'feed', icon: BarChart3, label: 'Feed' },
                        { id: 'sportsbook', icon: () => <span className="text-base leading-none mb-1">🎰</span>, label: 'Bets' },
                        { id: 'settings', icon: Settings, label: 'Manage' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (tab.id === 'feed' && activeTab !== 'feed') {
                                    window.history.pushState(null, '', '#feed')
                                } else if (activeTab === 'feed' && tab.id !== 'feed') {
                                    if (window.location.hash === '#feed') window.history.back()
                                }
                                setActiveTab(tab.id)
                            }}
                            className={cn(
                                'flex-1 py-3 px-2 rounded-2xl transition-all flex flex-col items-center justify-center font-outfit',
                                activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-600 hover:text-zinc-400'
                            )}
                        >
                            {tab.id === 'sportsbook'
                                ? <span className="text-base leading-none mb-1">🎰</span>
                                : <tab.icon className="w-4 h-4 mb-1" />}
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-10 bg-black min-h-screen">

                {/* ── SPORTSBOOK TAB ── */}
                {activeTab === 'sportsbook' && (
                    <SportsbookTab
                        groupId={id as string}
                        currentUserId={currentUserId || ''}
                        members={members}
                        isAdmin={isAdmin}
                    />
                )}

                {/* ── LEADERBOARD TAB ── */}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-6 animate-in">
                        {/* Timeframe Toggle */}
                        <div className="flex bg-zinc-900/60 p-1.5 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setTimeframe('week')}
                                className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", timeframe === 'week' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                            >
                                Weekly View
                            </button>
                            <button
                                onClick={() => setTimeframe('all-time')}
                                className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-amber-500 hover:text-amber-400", timeframe === 'all-time' ? "bg-amber-500/20 shadow-lg" : "")}
                            >
                                All-Time Records
                            </button>
                        </div>

                        {/* Week Navigator */}
                        {timeframe === 'week' && (
                            <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-white/5">
                                <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">{isCurrentWeek ? 'Current Week' : 'Past Week'}</p>
                                    <p className="text-xs font-black font-outfit text-white">{format(selectedWeekStart, 'MMM d')} — {format(selectedWeekEnd, 'MMM d, yyyy')}</p>
                                </div>
                                <button onClick={() => setWeekOffset(o => Math.min(0, o + 1))} disabled={isCurrentWeek} className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-end px-1">
                            <div className="space-y-1">
                                <h2 className="font-black font-outfit text-3xl tracking-tighter text-white">Ranking.</h2>
                                {timeframe === 'all-time' ? (
                                    <Badge className="bg-amber-500/20 text-amber-400 border-none text-[8px]">All-Time Hall of Fame</Badge>
                                ) : !isCurrentWeek ? (
                                    <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px]">Historical View</Badge>
                                ) : null}
                            </div>
                            <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
                                {[{ key: 'sales', icon: DollarSign, label: 'Sales' }, { key: 'tips', icon: Wallet, label: 'Tips' }].map(m => (
                                    <button key={m.key} onClick={() => setSortMetric(m.key as any)}
                                        className={cn('p-2 px-3 rounded-lg flex items-center gap-2 transition-all', sortMetric === m.key ? 'bg-primary text-white shadow-lg' : 'text-zinc-600')}>
                                        <m.icon className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {leaderboard.length > 0 ? leaderboard.map((player, i) => (
                                <LeaderboardItem
                                    key={player.id}
                                    name={player.name}
                                    value={`$${(sortMetric === 'sales' ? player.sales : player.tips).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                    rank={i + 1}
                                    type={sortMetric === 'sales' ? 'Weekly Net Sales' : 'Tips + Wage Combined'}
                                    avatar={player.avatar}
                                    isAdmin={player.isAdmin}
                                    isPrivate={player.isPrivate}
                                    onClick={() => handleViewIntel(player.id, player.name, player.isPrivate)}
                                />
                            )) : (
                                <div className="py-24 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5">
                                    <Trophy className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                                    <h3 className="font-black font-outfit text-xl text-white">No Data</h3>
                                    <p className="text-xs text-zinc-600 uppercase font-black tracking-widest mt-1">
                                        {isCurrentWeek ? 'First shift pending' : 'No shifts logged this week'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-2">Board Intel</p>
                                <p className="text-[10px] font-black font-outfit text-zinc-400 uppercase tracking-widest leading-relaxed">
                                    Rankings use <span className="text-white">Pre-Tax</span> totals · Tips include <span className="text-white">CC + Cash</span>
                                </p>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-1">Weekly Reset</p>
                                <p className="text-xs font-black font-outfit text-white uppercase tracking-widest">Monday @ 12:00 AM</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── FEED TAB ── */}
                {activeTab === 'feed' && (
                    <div className="fixed inset-0 z-[100] bg-black flex flex-col h-[100dvh] w-full max-w-md mx-auto">
                        {/* Transparent overlay to dismiss reaction popups by tapping anywhere */}
                        {activeReactionPopup && (
                            <div
                                className="absolute inset-0 z-40"
                                onClick={() => setActiveReactionPopup(null)}
                                onTouchStart={() => setActiveReactionPopup(null)}
                            />
                        )}
                        {/* Feed Header */}
                        <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl">
                            <button
                                onClick={() => {
                                    if (window.location.hash === '#feed') {
                                        window.history.back()
                                    } else {
                                        setActiveTab('leaderboard')
                                    }
                                }}
                                className="text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-1 -ml-2 rounded-lg transition-colors hover:bg-white/5"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Party</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Intel Feed</span>
                            </div>
                        </div>

                        {/* Feed Stream */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4 scroll-smooth">
                            {(() => {
                                const actualItems = []
                                const itemReactions: Record<string, any[]> = {}

                                for (const item of feedItems) {
                                    if (item.metadata?.type === 'reaction') {
                                        const tId = item.metadata.target_id
                                        if (!itemReactions[tId]) itemReactions[tId] = []
                                        itemReactions[tId].push(item)
                                    } else {
                                        // Ensure we don't accidentally render reaction texts if metadata is missing
                                        if (!item.content.startsWith('reaction:')) {
                                            actualItems.push(item)
                                        }
                                    }
                                }

                                return actualItems.length > 0 ? actualItems.map(item => {
                                    const isSystem = item.event_type === 'system'
                                    const memberMatch = members.find(m => m.user_id === item.user_id)
                                    const authorName = item.is_anonymous ? 'Ghost Server' : (memberMatch?.display_name || 'A server')
                                    const avatar = item.is_anonymous
                                        ? `https://api.dicebear.com/9.x/shapes/svg?seed=${item.id}&backgroundColor=000&shape1Color=111`
                                        : (memberMatch?.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`)

                                    // Aggregate reactions for this item
                                    const reactionsForThisItem = itemReactions[item.id] || []
                                    const groupedReactions: Record<string, string[]> = {}
                                    for (const r of reactionsForThisItem) {
                                        const emoji = r.metadata.emoji
                                        if (!groupedReactions[emoji]) groupedReactions[emoji] = []
                                        groupedReactions[emoji].push(r.user_id)
                                    }

                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "p-5 rounded-[2rem] relative transition-all shrink-0 group select-none [-webkit-touch-callout:none]",
                                                isSystem
                                                    ? "bg-zinc-900 border border-primary/20 shadow-[0_4px_30px_rgba(255,255,255,0.02)]"
                                                    : "bg-zinc-900/40 border border-white/5 active:bg-white/5 transition-colors"
                                            )}
                                            onContextMenu={(e) => {
                                                if (!isSystem) {
                                                    e.preventDefault()
                                                }
                                            }}
                                            onTouchStart={(e) => {
                                                if (!isSystem) {
                                                    longPressRefs.current[item.id] = setTimeout(() => {
                                                        setActiveReactionPopup(activeReactionPopup === item.id ? null : item.id)
                                                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15)
                                                    }, 400) // 400ms long press
                                                }
                                            }}
                                            onTouchEnd={() => {
                                                if (longPressRefs.current[item.id]) {
                                                    clearTimeout(longPressRefs.current[item.id])
                                                }
                                            }}
                                            onTouchMove={() => {
                                                if (longPressRefs.current[item.id]) {
                                                    clearTimeout(longPressRefs.current[item.id])
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                if (!isSystem) {
                                                    longPressRefs.current[item.id] = setTimeout(() => {
                                                        setActiveReactionPopup(activeReactionPopup === item.id ? null : item.id)
                                                    }, 500)
                                                }
                                            }}
                                            onMouseUp={() => {
                                                if (longPressRefs.current[item.id]) {
                                                    clearTimeout(longPressRefs.current[item.id])
                                                }
                                            }}
                                            onMouseLeave={() => {
                                                if (longPressRefs.current[item.id]) {
                                                    clearTimeout(longPressRefs.current[item.id])
                                                }
                                            }}
                                        >
                                            {isSystem && <div className="absolute inset-0 bg-primary/5 blur-2xl pointer-events-none"></div>}
                                            <div className="flex items-start gap-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300">
                                                <div
                                                    className={cn(
                                                        "w-10 h-10 rounded-full ring-2 ring-black bg-black shrink-0 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.8)] relative flex items-center justify-center transition-transform active:scale-90",
                                                        !isSystem && !item.is_anonymous && "cursor-pointer hover:ring-primary/50"
                                                    )}
                                                    onClick={() => {
                                                        if (!isSystem && !item.is_anonymous) {
                                                            handleViewIntel(item.user_id, authorName, false)
                                                        }
                                                    }}
                                                >
                                                    {isSystem ? (
                                                        <span className="text-xl">
                                                            {item.metadata?.type?.includes('sales') ? '🏆' : item.metadata?.type?.includes('tips') ? '💰' : '🔥'}
                                                        </span>
                                                    ) : item.is_anonymous ? (
                                                        <span className="text-xl opacity-80 backdrop-grayscale">👻</span>
                                                    ) : (
                                                        <>
                                                            <div className="absolute inset-0 bg-primary/20 blur-md opacity-50" />
                                                            <img src={avatar} alt="avatar" className="w-full h-full object-cover relative z-10" />
                                                        </>
                                                    )}
                                                </div>
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p
                                                            className={cn(
                                                                "text-xs font-black uppercase tracking-widest truncate",
                                                                isSystem ? "text-primary" : "text-amber-500",
                                                                !isSystem && !item.is_anonymous && "cursor-pointer hover:text-white transition-colors"
                                                            )}
                                                            onClick={() => {
                                                                if (!isSystem && !item.is_anonymous) {
                                                                    handleViewIntel(item.user_id, authorName, false)
                                                                }
                                                            }}
                                                        >
                                                            {isSystem ? 'System Alert' : authorName}
                                                            {item.is_anonymous && !isSystem && <span className="ml-1 opacity-50 text-[10px]">👻</span>}
                                                        </p>
                                                        <span className="text-[8px] font-black text-zinc-600 tracking-widest uppercase ml-auto shrink-0">
                                                            {format(new Date(item.created_at), 'MMM d, h:mm a')}
                                                        </span>
                                                        {!isSystem && item.user_id === currentUserId && (
                                                            <button
                                                                onClick={() => handleDeleteFeedItem(item.id, item.user_id)}
                                                                className="ml-1 shrink-0 p-1 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-400/10 active:text-red-400 active:bg-red-400/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className={cn(
                                                        "font-outfit text-sm tracking-tight leading-relaxed",
                                                        isSystem ? "text-white font-bold" : "text-zinc-300"
                                                    )}>
                                                        <span dangerouslySetInnerHTML={{ __html: item.content.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-black">$1</span>') }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reactions Row */}
                                            <div className="absolute bottom-2 right-4 flex items-center gap-1 z-20">
                                                {Object.entries(groupedReactions).map(([emoji, users]) => {
                                                    const reacts = Array.isArray(users) ? users : []
                                                    if (reacts.length === 0) return null
                                                    const hasReacted = currentUserId && reacts.includes(currentUserId)
                                                    return (
                                                        <motion.button
                                                            key={emoji}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); handleReaction(item.id, emoji) }}
                                                            className={cn(
                                                                "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 bg-black ring-1 transition-all",
                                                                hasReacted ? "ring-primary shadow-[0_0_10px_rgba(0,122,255,0.3)] shadow-primary/20 bg-primary/10" : "ring-white/10 text-zinc-400"
                                                            )}
                                                        >
                                                            <span>{emoji}</span>
                                                            <span className="font-bold text-[10px]">{reacts.length}</span>
                                                        </motion.button>
                                                    )
                                                })}
                                            </div>

                                            {/* Reaction Popup trigger removed (now uses long press) */}

                                            <AnimatePresence>
                                                {activeReactionPopup === item.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        className="absolute -top-10 right-4 z-50 bg-zinc-800 backdrop-blur-xl border border-white/10 p-1.5 rounded-full flex gap-1 shadow-2xl origin-bottom-right"
                                                    >
                                                        {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                            <motion.button
                                                                key={emoji}
                                                                whileHover={{ scale: 1.2, y: -2 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                className="text-xl p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                                                onClick={(e) => { e.stopPropagation(); handleReaction(item.id, emoji) }}
                                                            >
                                                                {emoji}
                                                            </motion.button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                }) : (
                                    <div className="py-24 my-auto text-center opacity-50 space-y-4 bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5">
                                        <BarChart3 className="w-8 h-8 mx-auto text-zinc-600" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">The floor is quiet... for now.</p>
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Input Area */}
                        <div className="shrink-0 p-4 border-t border-white/5 bg-zinc-900/80 backdrop-blur-2xl">
                            <form onSubmit={handlePostChat} className="flex flex-col gap-3">
                                {/* Segmented Toggle */}
                                <div className="flex p-1 bg-black rounded-xl border border-white/10 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setIsAnonymousPost(false)}
                                        className={cn("flex-1 py-2 px-3 text-[10px] rounded-lg font-black uppercase tracking-widest transition-all truncate", !isAnonymousPost ? "bg-zinc-800 text-white shadow-md ring-1 ring-white/10" : "text-zinc-500 hover:text-white")}
                                    >
                                        👤 {members.find(m => m.user_id === currentUserId)?.display_name || 'Identity'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAnonymousPost(true)}
                                        className={cn("flex-1 py-2 px-3 text-[10px] rounded-lg font-black uppercase tracking-widest transition-all", isAnonymousPost ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400" : "text-zinc-500 hover:text-amber-500/50")}
                                    >
                                        👻 Ghost
                                    </button>
                                </div>

                                {/* Text Input */}
                                <div className="flex items-center gap-2 bg-black py-2 px-2.5 rounded-[1.5rem] border border-white/10 shadow-xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder={isAnonymousPost ? "Whisper into the void..." : "Spill the tea..."}
                                        maxLength={280}
                                        className="flex-1 bg-transparent px-3 text-sm font-outfit font-bold text-white placeholder:text-zinc-600 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim() || postingChat}
                                        className={cn("w-10 h-10 shrink-0 rounded-[1.2rem] flex items-center justify-center transition-all disabled:opacity-50", chatInput.trim() ? "bg-primary text-white shadow-[0_0_15px_rgba(0,122,255,0.4)] hover:scale-105 active:scale-95" : "bg-white/5 text-zinc-600")}
                                    >
                                        <ArrowUpRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── SETTINGS TAB ── */}
                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-in pb-12 px-1">
                        <div className="px-1 space-y-1">
                            <h2 className="font-black font-outfit text-2xl text-white tracking-tighter">Manage Party.</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 opacity-80">Admin Controls</p>
                        </div>

                        {isAdmin && (
                            <div className="space-y-6">
                                <div className="px-1 border-t border-white/5 pt-6 space-y-1">
                                    <h3 className="font-black font-outfit text-xl text-white tracking-tighter">Party Control.</h3>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 opacity-80">Admin access granted</p>
                                </div>

                                {/* Invite Code */}
                                <Card className={`!p-6 bg-zinc-900/40 border-white/5 rounded-3xl space-y-4 transition-all ${editingCode ? 'ring-2 ring-primary/40' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Invite Code</p>
                                        {!editingCode && (
                                            <button onClick={() => { setNewCode(group?.invite_code || ''); setEditingCode(true) }}
                                                className="text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
                                                Edit Code
                                            </button>
                                        )}
                                    </div>
                                    {editingCode ? (
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <input
                                                    autoFocus
                                                    value={newCode}
                                                    onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                                                    maxLength={6}
                                                    placeholder="4–6 characters"
                                                    className="w-full bg-black border border-primary/30 rounded-2xl px-5 py-4 font-mono font-black text-2xl text-primary tracking-[0.5em] text-center placeholder:text-zinc-700 placeholder:text-base placeholder:tracking-widest focus:outline-none focus:border-primary"
                                                />
                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-center">{newCode.length}/6 · letters and numbers only</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingCode(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors">Cancel</button>
                                                <button onClick={handleUpdateCode} disabled={savingCode || newCode.length < 4} className="flex-1 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-40">
                                                    {savingCode ? 'Saving...' : 'Save Code'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <button onClick={() => { setNewCode(group?.invite_code || ''); setEditingCode(true) }}
                                                className="w-full flex items-center justify-center py-4 bg-black rounded-2xl ring-1 ring-white/5 hover:ring-primary/30 transition-all group">
                                                <code className="font-mono font-black text-primary text-3xl tracking-[0.5em] group-hover:text-white transition-colors">{group?.invite_code}</code>
                                            </button>
                                            <div className="flex gap-2 bg-black/40 p-2 rounded-2xl ring-1 ring-white/5">
                                                <code className="flex-1 px-3 py-2 font-mono font-bold text-zinc-500 text-[10px] truncate flex items-center">
                                                    percoco-pool.vercel.app/join/{group?.invite_code}
                                                </code>
                                                <Button type="button" className="px-4 py-2 text-xs shrink-0 rounded-xl"
                                                    onClick={() => { navigator.clipboard.writeText(`https://percoco-pool.vercel.app/join/${group?.invite_code}`); toast.success('Copied!') }}>
                                                    Copy
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                {/* Member Roster */}
                                <Card className="!p-6 bg-zinc-900/40 border-white/5 rounded-3xl space-y-4 shadow-2xl">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Member Command</p>
                                    <div className="space-y-2">
                                        {members.map((m: any) => (
                                            <div key={m.user_id} className="flex items-center justify-between p-4 bg-black rounded-2xl border border-white/5 group/member transition-all hover:border-primary/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-zinc-900 overflow-hidden ring-1 ring-white/10 group-hover/member:ring-primary/50 transition-all">
                                                        <img src={(m.profiles as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.display_name}`} alt="avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-black font-outfit text-white tracking-tight leading-none group-hover/member:text-primary transition-colors">{m.display_name}</p>
                                                            {m.user_id === group?.owner_id && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                                        </div>
                                                        {(m.profiles as any)?.share_to_leaderboard === false && (
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mt-0.5">Opted out</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {m.user_id !== currentUserId && m.user_id !== group?.owner_id && (
                                                    <button
                                                        onClick={() => handleKickMember(m.user_id)}
                                                        disabled={kickingId === m.user_id}
                                                        className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors disabled:opacity-40"
                                                    >
                                                        {kickingId === m.user_id ? '...' : 'Remove'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* ── PLAYER INTEL MODAL ── */}
            <Modal isOpen={!!selectedUserIntel} onClose={() => setSelectedUserIntel(null)} title={selectedUserIntel?.isPrivate ? 'Stats Hidden' : `${selectedUserIntel?.name?.split(' ')[0]}'s Portal`}>
                <div className="space-y-6 overflow-y-auto max-h-[65vh] pr-2 pb-4 scroll-smooth">
                    {selectedUserIntel?.isPrivate ? (
                        <div className="py-16 flex flex-col items-center gap-4 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                                <EyeOff className="w-10 h-10 text-zinc-700" />
                            </div>
                            <div>
                                <p className="font-black font-outfit text-xl text-white tracking-tighter">{selectedUserIntel?.name}</p>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-600 mt-1">has hidden their stats</p>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest max-w-[70%] leading-relaxed">
                                This member has opted out of the leaderboard. Their data is private.
                            </p>
                            <Button variant="secondary" onClick={() => setSelectedUserIntel(null)} className="mt-4 px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl">
                                Close
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Intel Tabs */}
                            <div className="flex p-1 bg-black rounded-xl border border-white/10 shadow-inner mb-4">
                                {['profile', 'shifts'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setIntelTab(tab as any)}
                                        className={cn(
                                            "flex-1 py-2 px-3 text-[10px] rounded-lg font-black uppercase tracking-widest transition-all",
                                            intelTab === tab
                                                ? "bg-primary text-white shadow-md ring-1 ring-white/10"
                                                : "text-zinc-500 hover:text-white"
                                        )}
                                    >
                                        {tab === 'profile' ? '👤 Profile' : '📈 Intelligence'}
                                    </button>
                                ))}
                            </div>

                            {intelTab === 'profile' ? (
                                <>
                                    {/* Player ID Card Header */}
                                    <div className="flex flex-col items-center gap-3 p-5 bg-zinc-900 border border-white/5 rounded-3xl relative overflow-hidden ring-1 ring-white/5">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                                        <div className="w-24 h-24 rounded-full bg-black ring-4 ring-zinc-900 overflow-hidden relative z-10 shadow-2xl">
                                            <img
                                                src={selectedUserIntel?.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserIntel?.name}`}
                                                alt="avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <h3 className="font-black font-outfit text-2xl tracking-tighter text-white">
                                                {selectedUserIntel?.name}
                                            </h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-0.5">
                                                Party Member Dossier
                                            </p>
                                        </div>

                                        {/* Mini Profile Stats Grid */}
                                        <div className="grid grid-cols-2 gap-2 mt-2 w-full relative z-10">
                                            <div className="bg-black/50 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Birthday</span>
                                                <span className="text-[10px] font-black tracking-widest text-white">🎂 {selectedUserIntel?.profile?.birthday || 'Private'}</span>
                                            </div>
                                            <div className="bg-black/50 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Serving Since</span>
                                                <span className="text-[10px] font-black tracking-widest text-white">{selectedUserIntel?.profile?.work_anniversary || 'Private'}</span>
                                            </div>
                                        </div>

                                        {selectedUserIntel?.profile?.bio && (
                                            <div className="mt-2 w-full p-4 bg-black/30 rounded-2xl border border-white/5 relative z-10">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Dossier / Bio</p>
                                                <p className="text-[10px] font-outfit text-zinc-400 leading-relaxed italic">"{selectedUserIntel.profile.bio}"</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {!isCurrentWeek && (
                                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                                                {format(selectedWeekStart, 'MMM d')} — {format(selectedWeekEnd, 'MMM d')}
                                            </p>
                                        </div>
                                    )}                            {selectedUserIntel?.shifts?.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">Weekly Overview</p>
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div>
                                                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total Sales</p>
                                                        <p className="text-xl font-black font-outfit text-white tracking-tighter">
                                                            ${selectedUserIntel.shifts.reduce((acc: number, s: any) => acc + parseFloat(s.net_sales || 0), 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Tips + Wage</p>
                                                        <p className="text-xl font-black font-outfit text-white tracking-tighter">
                                                            ${selectedUserIntel.shifts.reduce((acc: number, s: any) => acc + parseFloat(s.tips || 0) + parseFloat(s.computed_data?.cashTips || 0) + parseFloat(s.computed_data?.wageEarnings || 0), 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">Session History</p>
                                                {selectedUserIntel.shifts.map((shift: any, idx: number) => (
                                                    <div key={idx} className="bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-3">
                                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-3 h-3 text-primary" />
                                                                <span className="text-[10px] font-black text-white font-outfit">{format(new Date(shift.date + 'T12:00:00'), 'EEE, MMM do')}</span>
                                                                {(() => {
                                                                    const grade = calculateShiftGrade(
                                                                        parseFloat(shift.net_sales || 0),
                                                                        parseFloat(shift.tips || 0) + parseFloat(shift.computed_data?.cashTips || 0)
                                                                    )
                                                                    if (grade.grade === '-') return null
                                                                    return (
                                                                        <span className={cn("text-[8px] font-black font-outfit px-1.5 py-0.5 rounded-md bg-black border border-white/5 shadow-inner", grade.color)}>
                                                                            {grade.grade}
                                                                        </span>
                                                                    )
                                                                })()}
                                                            </div>
                                                            <Badge className="bg-zinc-800 text-zinc-500 text-[8px] px-2 py-0.5 border-none capitalize">{shift.shift_type}</Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-0.5">
                                                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Sales</p>
                                                                <p className="text-sm font-black font-outfit text-white">${parseFloat(shift.net_sales).toLocaleString()}</p>
                                                            </div>
                                                            <div className="space-y-0.5 text-right">
                                                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Tips + Wage</p>
                                                                <p className="text-sm font-black font-outfit text-white">
                                                                    ${(parseFloat(shift.tips) + parseFloat(shift.computed_data?.cashTips || 0) + parseFloat(shift.computed_data?.wageEarnings || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center opacity-50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No shifts logged for this week.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <Button variant="secondary" onClick={() => setSelectedUserIntel(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl">
                                    Close
                                </Button>
                                {isAdmin && selectedUserIntel?.userId !== currentUserId && selectedUserIntel?.userId !== group?.owner_id && (
                                    <button
                                        onClick={() => handleKickMember(selectedUserIntel.userId)}
                                        disabled={kickingId === selectedUserIntel?.userId}
                                        className="px-5 py-4 rounded-2xl bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors disabled:opacity-40 flex items-center gap-2"
                                    >
                                        <ShieldAlert className="w-4 h-4" />
                                        {kickingId === selectedUserIntel?.userId ? '...' : 'Remove'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}
