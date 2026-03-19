"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Modal, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trophy, Settings, BarChart3, Crown, UsersRound, DollarSign, Wallet, RefreshCcw, Calendar, ArrowUpRight, ChevronLeft, ChevronRight, EyeOff, ShieldAlert, Hash, Pencil, Check, X, Trash2, User, UserMinus, Instagram, Medal, Vote, Plus, BarChart, Image as ImageIcon, Film, Camera, Search, Loader2, AlertCircle, Flag, Ban } from 'lucide-react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { calculateShiftGrade } from '@/lib/calculations'
import SportsbookTab from '@/components/SportsbookTab'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Achievements Definition ──────────────────────────────────────────────────
const ACHIEVEMENTS = [
    {
        id: 'whale_hunter',
        label: 'Whale Hunter',
        description: 'Logged a single shift with $2,500+ in net sales.',
        icon: '🏹',
        requirement: 'Sales > $2,500',
        color: 'from-blue-500 to-cyan-400'
    },
    {
        id: 'tip_king',
        label: 'Tip Monarch',
        description: 'Cleared $500 in tips on a single shift.',
        icon: '💰',
        requirement: 'Tips > $500',
        color: 'from-yellow-400 to-amber-600'
    },
    {
        id: 'marathoner',
        label: 'Marathoner',
        description: 'Logged a single shift over 10 hours long.',
        icon: '👟',
        requirement: 'Shift > 10 Hours',
        color: 'from-emerald-400 to-teal-600'
    },
    {
        id: 'on_fire',
        label: 'On Fire',
        description: 'Logged 5+ shifts in a single week.',
        icon: '🔥',
        requirement: '5+ Shifts/Week',
        color: 'from-orange-500 to-red-600'
    },
    {
        id: 'weekend_warrior',
        label: 'Weekend Warrior',
        description: 'Logged the most total hours for Friday, Saturday, and Sunday of the current week.',
        icon: '⚡',
        requirement: 'Most Fri-Sun Hours',
        color: 'from-pink-500 to-rose-600'
    },
    {
        id: 'legendary',
        label: 'Legendary',
        description: 'Logged 50 shifts in total.',
        icon: '💎',
        requirement: '50 Total Shifts',
        color: 'from-indigo-600 to-purple-800'
    }
]

// ─── Leaderboard Item ────────────────────────────────────────────────────────
function LeaderboardItem({ name, value, rank, type, avatar, userId, isAdmin: itemIsAdmin, isPrivate, medals, onClick }: {
    name: string
    value: string
    rank: number
    type: string
    avatar?: string
    userId?: string
    isAdmin?: boolean
    isPrivate?: boolean
    medals?: string[]
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
                            : <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || name}`} alt="Avatar" className="w-full h-full object-cover" />
                        }
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="font-black font-outfit text-sm tracking-tight text-white">{name}</p>
                            {itemIsAdmin && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                            {medals && medals.length > 0 && (
                                <div className="flex items-center gap-0.5 ml-1">
                                    {medals.slice(0, 3).map((m, idx) => {
                                        const ach = ACHIEVEMENTS.find(a => a.id === m);
                                        return (
                                            <span key={idx} className="text-[10px]" title={ach?.label}>
                                                {ach?.icon}
                                            </span>
                                        );
                                    })}
                                    {medals.length > 3 && <span className="text-[8px] text-zinc-500 font-black">+{medals.length - 3}</span>}
                                </div>
                            )}
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
    const [userAchievements, setUserAchievements] = useState<string[]>([])
    const [groupAchievements, setGroupAchievements] = useState<Record<string, string[]>>({})
    const [weekendWarriorId, setWeekendWarriorId] = useState<string | null>(null)
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
    const [hasUnreadFeed, setHasUnreadFeed] = useState(false)
    const [showGiphyPicker, setShowGiphyPicker] = useState(false)
    const [giphySearch, setGiphySearch] = useState('')
    const [giphyResults, setGiphyResults] = useState<any[]>([])
    const [giphyLoading, setGiphyLoading] = useState(false)
    const [uploadingMedia, setUploadingMedia] = useState(false)
    const [pendingMedia, setPendingMedia] = useState<{ url: string, type: 'image' | 'gif' } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showDeletePartyModal, setShowDeletePartyModal] = useState(false)
    const [deletingParty, setDeletingParty] = useState(false)
    const [partySettings, setPartySettings] = useState({
        supportPct: 5,
        tipOutLabel: 'Support Pool',
        tipOutMode: 'net_sales' as 'net_sales' | 'cc_tips',
        taxRate: 15,
    })
    const [savingSettings, setSavingSettings] = useState(false)

    // Helper for haptic feedback
    const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(style === 'heavy' ? 20 : style === 'medium' ? 15 : 10)
        }
    }


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
        // Sync party settings
        if (groupData?.settings) {
            const s = groupData.settings
            setPartySettings({
                supportPct: s.supportPct != null ? Math.round(s.supportPct * 100) : 5,
                tipOutLabel: s.tipOutLabel || 'Support Pool',
                tipOutMode: s.tipOutMode || 'net_sales',
                taxRate: s.taxRate != null ? Math.round(s.taxRate * 100) : 15,
            })
        }
        const { data: memberData } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', id)

        if (memberData && memberData.length > 0) {
            const userIds = memberData.map((m: any) => m.user_id)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, avatar_url, share_to_leaderboard, birthday, work_anniversary, bio, phone, instagram, favorite_section')
                .in('id', userIds)

            const enrichedMembers = memberData.map((m: any) => ({
                ...m,
                profiles: profileData?.find((p: any) => p.id === m.user_id) || null
            }))

            setMembers(enrichedMembers)

            // Fetch ALL Achievements for the group
            const { data: allAchievements } = await supabase
                .from('user_achievements')
                .select('user_id, achievement_type')
                .eq('group_id', id)

            if (allAchievements) {
                const map: Record<string, string[]> = {}
                allAchievements.forEach((a: any) => {
                    if (!map[a.user_id]) map[a.user_id] = []
                    map[a.user_id].push(a.achievement_type)
                })
                setGroupAchievements(map)
                setUserAchievements(map[user.id] || [])
            }
        } else {
            setMembers([])
        }

        // Check for unread feed items for THIS group
        const lastRead = localStorage.getItem(`percoco_last_read_${id}`) || new Date(0).toISOString()
        const { count } = await supabase
            .from('party_feed')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', id)
            .gt('created_at', lastRead)

        setHasUnreadFeed((count || 0) > 0)
        setLoading(false)
        setRefreshing(false)
    }, [id, supabase, router])

    // Subscription for new feed items to show the dot
    useEffect(() => {
        const channel = supabase.channel(`feed-updates-${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'party_feed',
                filter: `group_id=eq.${id}`
            }, (payload: any) => {
                if (activeTab !== 'feed') {
                    setHasUnreadFeed(true)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id, activeTab, supabase])

    // Clear notifications when viewing feed
    useEffect(() => {
        if (activeTab === 'feed') {
            const now = new Date().toISOString()
            localStorage.setItem(`percoco_last_read_${id}`, now)
            localStorage.setItem('percoco_last_read_all', now)
            setHasUnreadFeed(false)
            window.dispatchEvent(new Event('percoco_feed_read'))
        }
    }, [activeTab, id])

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
        // Calculate Weekend Warrior (Most hours Fri-Sun)
        let maxHours = 0
        let currentWarriorId = null
        members.forEach(m => {
            const userShifts = rawShifts.filter(s => s.user_id === m.user_id)
            const userWeekendShifts = userShifts.filter(s => {
                const d = new Date(s.date).getDay()
                return d === 5 || d === 6 || d === 0 // Fri, Sat, Sun
            })
            const totalHours = userWeekendShifts.reduce((acc, s) => acc + (parseFloat(s.duration) || 0), 0)
            if (totalHours > 0 && totalHours >= maxHours) {
                // If it's a tie, the more recent one or just first-come?
                // Let's say last person to hit the top hours takes it
                maxHours = totalHours
                currentWarriorId = m.user_id
            }
        })
        setWeekendWarriorId(currentWarriorId)

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
            } else {
                triggerHaptic('light')
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
            } else {
                triggerHaptic('light')
            }
        }
    }


    const handlePostChat = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        const mediaUrl = pendingMedia?.url
        const mediaType = pendingMedia?.type

        if (!chatInput.trim() && !mediaUrl) return
        if (!currentUserId) return

        setPostingChat(true)
        const tempId = crypto.randomUUID()
        const payload = {
            id: tempId,
            group_id: id as string,
            user_id: currentUserId,
            event_type: 'chat' as const,
            content: chatInput.trim(),
            metadata: {
                ...(mediaUrl ? { [mediaType === 'gif' ? 'gif_url' : 'image_url']: mediaUrl } : {})
            },
            is_anonymous: isAnonymousPost
        }

        // Optimistic UI update
        const userProfile = members.find(m => m.user_id === currentUserId)?.profiles
        setFeedItems(prev => [{
            ...payload,
            created_at: new Date().toISOString(),
            profiles: userProfile
        }, ...prev])

        setChatInput('')
        setPendingMedia(null)

        const { error } = await supabase.from('party_feed').insert(payload)
        setPostingChat(false)
        if (error) {
            toast.error("Failed to post message")
            setFeedItems(prev => prev.filter(i => i.id !== tempId))
        } else {
            triggerHaptic('medium')
        }
    }

    const searchGiphy = useCallback(async (query: string) => {
        setGiphyLoading(true)
        try {
            const res = await fetch(`/api/giphy?q=${encodeURIComponent(query)}`)
            if (!res.ok) throw new Error('Proxy failed')
            const { success, results } = await res.json()
            if (success && results.length > 0) {
                setGiphyResults(results)
            } else {
                setGiphyResults([])
                if (!success) toast.error("Meme connection blocked. Refreshing might help.")
            }
        } catch (error) {
            console.error('GIF Global Error:', error)
            toast.error("Meme connection error.")
        } finally {
            setGiphyLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!showGiphyPicker) return
        const timeoutId = setTimeout(() => {
            searchGiphy(giphySearch)
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [giphySearch, showGiphyPicker, searchGiphy])

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentUserId) return

        setUploadingMedia(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `${currentUserId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('feed_media')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('feed_media')
                .getPublicUrl(filePath)

            setPendingMedia({ url: publicUrl, type: 'image' })
            toast.success("Photo ready!")
        } catch (error: any) {
            toast.error(error.message || "Failed to upload photo")
        } finally {
            setUploadingMedia(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }


    const handleSavePartySettings = async () => {
        setSavingSettings(true)
        try {
            const settingsPayload = {
                supportPct: partySettings.supportPct / 100,
                tipOutLabel: partySettings.tipOutLabel,
                tipOutMode: partySettings.tipOutMode,
                taxRate: partySettings.taxRate / 100,
                timezone: group?.settings?.timezone || 'UTC',
                enabledTipouts: group?.settings?.enabledTipouts || [],
            }
            const { error } = await supabase.from('groups').update({ settings: settingsPayload }).eq('id', id)
            if (error) throw error
            setGroup((prev: any) => ({ ...prev, settings: settingsPayload }))
            toast.success('Party settings saved!')
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSavingSettings(false)
        }
    }

    const handleDeleteParty = async () => {
        setDeletingParty(true)
        try {
            // Delete shift entries for this group
            await supabase.from('shift_entries').delete().eq('group_id', id)
            // Delete feed items
            await supabase.from('party_feed').delete().eq('group_id', id)
            // Delete members
            await supabase.from('group_members').delete().eq('group_id', id)
            // Delete the group itself
            const { error } = await supabase.from('groups').delete().eq('id', id)
            if (error) throw error
            toast.success('Party dissolved.')
            router.push('/app/groups')
        } catch (e: any) {
            toast.error(e.message)
            setDeletingParty(false)
        }
        setShowDeletePartyModal(false)
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
                                    <img
                                        src={(m.profiles as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`}
                                        alt="member"
                                        className="w-full h-full object-cover relative z-10"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`
                                        }}
                                    />
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
                                'flex-1 py-3 px-2 rounded-2xl transition-all flex flex-col items-center justify-center font-outfit relative',
                                activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-600 hover:text-zinc-400'
                            )}
                        >
                            <div className="relative">
                                {tab.id === 'sportsbook'
                                    ? <span className="text-base leading-none mb-1">🎰</span>
                                    : <tab.icon className="w-4 h-4 mb-1" />}
                                {tab.id === 'feed' && hasUnreadFeed && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-900 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                )}
                            </div>
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
                        onViewIntel={handleViewIntel}
                    />
                )}
                {activeTab === 'achievements' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in zoom-in duration-700 pb-20">
                        <div className="relative mb-12 group">
                            {/* Outer glowing pulsing ring */}
                            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse group-hover:bg-primary/30 transition-all duration-700" />
                            {/* Inner spinning/rotating glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent blur-xl rounded-full animate-[spin_4s_linear_infinite]" />

                            {/* Main Icon container */}
                            <div className="w-28 h-28 relative rounded-full bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
                                {/* Subtle inner animated gradient */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                <Medal className="w-12 h-12 text-primary drop-shadow-[0_0_12px_rgba(11,219,37,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
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
                                Medal Rack
                            </h3>

                            <p className="text-sm font-medium text-zinc-400 leading-relaxed">
                                The trophy case is being polished. Keep your stats high—we're tracking every shift while we finalize the display!
                            </p>
                        </div>

                        {/* Decorative icons at the bottom */}
                        <div className="mt-16 flex gap-4 opacity-40 grayscale blur-[1px]">
                            <Trophy className="w-8 h-8 animate-pulse text-zinc-500" style={{ animationDelay: '0ms' }} />
                            <Medal className="w-6 h-6 animate-pulse text-zinc-500 mt-4" style={{ animationDelay: '500ms' }} />
                            <Medal className="w-8 h-8 animate-pulse text-zinc-500" style={{ animationDelay: '1000ms' }} />
                        </div>
                    </div>
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
                                className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-amber-500 hover:text-amber-400 flex flex-col items-center justify-center gap-0.5", timeframe === 'all-time' ? "bg-amber-500/20 shadow-lg" : "")}
                            >
                                <span>Hall of Fame</span>
                                <span className="text-[7px] opacity-60 font-bold lowercase tracking-normal">Running totals since start</span>
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
                                    userId={player.id}
                                    value={`$${(sortMetric === 'sales' ? player.sales : player.tips).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                    rank={i + 1}
                                    type={sortMetric === 'sales' ? 'Weekly Net Sales' : 'Tips + Wage Combined'}
                                    avatar={player.avatar}
                                    isAdmin={player.isAdmin}
                                    isPrivate={player.isPrivate}
                                    medals={[
                                        ...(groupAchievements[player.id] || []),
                                        ...(player.id === weekendWarriorId ? ['weekend_warrior'] : [])
                                    ].filter((v, i, a) => a.indexOf(v) === i)}
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
                    <div className="fixed inset-0 z-[1000] bg-black flex flex-col h-[100dvh] w-full max-w-md mx-auto overflow-hidden overscroll-none pt-safe pb-safe">
                        {/* Transparent overlay to dismiss reaction popups by tapping anywhere */}
                        {activeReactionPopup && (
                            <div
                                className="absolute inset-0 z-40"
                                onClick={() => setActiveReactionPopup(null)}
                                onTouchStart={() => setActiveReactionPopup(null)}
                            />
                        )}
                        {/* Feed Header */}
                        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl">
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
                                <ChevronLeft className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Party</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Pool Feed</span>
                            </div>
                        </div>

                        {/* Feed Stream */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4 scroll-smooth overscroll-contain">
                            {(() => {
                                const actualItems = []
                                const itemReactions: Record<string, any[]> = {}

                                for (const item of feedItems) {
                                    if (item.metadata?.type === 'reaction') {
                                        const tId = item.metadata.target_id
                                        if (!itemReactions[tId]) itemReactions[tId] = []
                                        itemReactions[tId].push(item)
                                    } else {
                                        const isSystem = item.event_type === 'system'
                                        const content = item.content || ''
                                        
                                        let shouldHide = false
                                        if (isSystem) {
                                            // 1. Filter out letter grades (A+, A, B, etc.)
                                            const gradeRegex = /\*\*Grade: [A-F][+-]?\*\*/i
                                            if (gradeRegex.test(content)) shouldHide = true
                                            
                                            // 2. Filter out screenshot notifications
                                            if (content.toLowerCase().includes('screenshot')) shouldHide = true
                                            
                                            // 3. Filter out non-PB medal notifications
                                            if (item.metadata?.type === 'achievement_unlocked' && !content.toLowerCase().includes('personal best')) {
                                                shouldHide = true
                                            }
                                        }

                                        if (!shouldHide && !item.content.startsWith('reaction:')) {
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
                                        : (memberMatch?.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`)

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
                                                "p-3.5 rounded-2xl relative transition-all shrink-0 group tap-highlight-transparent touch-pan-y select-none",
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
                                                        triggerHaptic('medium')
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
                                                            {item.metadata?.type === 'achievement_unlocked' ? '🎖️' : item.metadata?.type?.includes('sales') ? '🏆' : item.metadata?.type?.includes('tips') ? '💰' : '🔥'}
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
                                                        {!isSystem && !item.is_anonymous && (
                                                            <div className="flex items-center gap-0.5 ml-1 bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5">
                                                                {[
                                                                    ...(groupAchievements[item.user_id] || []),
                                                                    ...(item.user_id === weekendWarriorId ? ['weekend_warrior'] : [])
                                                                ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).map((m, idx) => {
                                                                    const ach = ACHIEVEMENTS.find(a => a.id === m);
                                                                    return (
                                                                        <span key={idx} className="text-[10px]" title={ach?.label}>
                                                                            {ach?.icon}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {(groupAchievements[item.user_id]?.length || 0) + (item.user_id === weekendWarriorId ? 1 : 0) > 3 && (
                                                                    <span className="text-[8px] text-zinc-500 font-black">+{((groupAchievements[item.user_id]?.length || 0) + (item.user_id === weekendWarriorId ? 1 : 0)) - 3}</span>
                                                                )}
                                                            </div>
                                                        )}
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
                                                        {item.metadata?.image_url && (
                                                            <div className="mb-3 rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                                                                <img src={item.metadata.image_url} alt="Feed media" className="w-full h-auto max-h-[400px] object-contain mx-auto" loading="lazy" />
                                                            </div>
                                                        )}
                                                        {item.metadata?.gif_url && (
                                                            <div className="mb-3 rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                                                                <img src={item.metadata.gif_url} alt="GIF" className="w-full h-auto max-h-[400px] object-contain mx-auto" loading="lazy" />
                                                            </div>
                                                        )}
                                                        {item.event_type === 'poll' ? (
                                                            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-dashed border-white/5 text-center">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Archived Tactical Poll</p>
                                                                <p className="text-white font-bold mt-1">{item.metadata?.question || item.content}</p>
                                                            </div>
                                                        ) : (
                                                            <span dangerouslySetInnerHTML={{ __html: item.content.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-black">$1</span>') }} />
                                                        )}
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
                                                                "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 bg-black ring-1 transition-all tap-highlight-transparent touch-manipulation",
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
                                                                className="text-xl p-1.5 hover:bg-white/10 rounded-full transition-colors tap-highlight-transparent select-none"
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
                        <div className="shrink-0 p-3 pb-[calc(80px+env(safe-area-inset-bottom))] border-t border-white/5 bg-zinc-900/98 backdrop-blur-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
                            <form onSubmit={handlePostChat} className="flex flex-col gap-3">
                                <AnimatePresence>
                                    {pendingMedia && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary shadow-2xl group self-start mb-1"
                                        >
                                            <img src={pendingMedia.url} alt="Selection" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setPendingMedia(null)}
                                                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Segmented Toggle */}
                                <div className="flex p-0.5 bg-black rounded-lg border border-white/10 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setIsAnonymousPost(false)}
                                        className={cn("flex-1 py-1 px-3 text-[9px] rounded-md font-black uppercase tracking-widest transition-all truncate", !isAnonymousPost ? "bg-zinc-800 text-white shadow-md ring-1 ring-white/10" : "text-zinc-500 hover:text-white")}
                                    >
                                        👤 {members.find(m => m.user_id === currentUserId)?.display_name || 'Identity'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAnonymousPost(true)}
                                        className={cn("flex-1 py-1 px-3 text-[9px] rounded-md font-black uppercase tracking-widest transition-all", isAnonymousPost ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400" : "text-zinc-500 hover:text-amber-500/50")}
                                    >
                                        👻 Ghost
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 bg-black py-1.5 px-2 rounded-xl border border-white/10 shadow-xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <button
                                        type="button"
                                        onClick={() => setShowGiphyPicker(true)}
                                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                                        title="Post a GIF"
                                    >
                                        <Film className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingMedia}
                                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-all active:scale-95 flex items-center justify-center overflow-hidden"
                                        title="Upload a Photo"
                                    >
                                        {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    </button>
                                    <input
                                        type="file"
                                        hidden
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                    />
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder={isAnonymousPost ? "Whisper..." : "Spill the tea..."}
                                        maxLength={280}
                                        className="flex-1 bg-transparent px-2 text-sm font-outfit font-bold text-white placeholder:text-zinc-600 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={(!chatInput.trim() && !pendingMedia) || postingChat}
                                        className={cn(
                                            "w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-all disabled:opacity-50",
                                            chatInput.trim() || pendingMedia ? "bg-primary text-white shadow-[0_0_15px_rgba(0,122,255,0.4)] hover:scale-105 active:scale-95" : "bg-white/5 text-zinc-600"
                                        )}
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
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

                                {/* Party Settings */}
                                <Card className="!p-6 bg-zinc-900/40 border-white/5 rounded-3xl space-y-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Party Settings</p>
                                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black">Per-Restaurant Config</Badge>
                                    </div>

                                    {/* Tip Out % */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tip Out %</label>
                                            <span className="text-lg font-black font-outfit text-primary">{partySettings.supportPct}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="30" step="0.5"
                                            value={partySettings.supportPct}
                                            onChange={e => setPartySettings(p => ({ ...p, supportPct: parseFloat(e.target.value) }))}
                                            className="w-full accent-primary"
                                        />
                                        <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                                            <span>0%</span><span>15%</span><span>30%</span>
                                        </div>
                                    </div>

                                    {/* Tip Out Label */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Tip Out Label</label>
                                        <input
                                            type="text"
                                            value={partySettings.tipOutLabel}
                                            onChange={e => setPartySettings(p => ({ ...p, tipOutLabel: e.target.value }))}
                                            placeholder="e.g. Support Pool, Bar Back, House"
                                            className="w-full bg-black border border-white/5 rounded-2xl px-4 py-3 text-sm font-black text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/40 transition-all"
                                        />
                                    </div>

                                    {/* Tip Out Mode */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Tip Out Calculated On</label>
                                        <div className="flex gap-2">
                                            {[{ val: 'net_sales' as const, label: '% of Net Sales' }, { val: 'cc_tips' as const, label: '% of CC Tips' }].map(opt => (
                                                <button
                                                    key={opt.val}
                                                    type="button"
                                                    onClick={() => setPartySettings(p => ({ ...p, tipOutMode: opt.val }))}
                                                    className={cn(
                                                        'flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border',
                                                        partySettings.tipOutMode === opt.val
                                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                            : 'bg-black text-zinc-600 border-white/5 hover:text-zinc-300'
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tax Rate */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Est. Tax Rate</label>
                                            <span className="text-lg font-black font-outfit text-indigo-400">{partySettings.taxRate}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="40" step="1"
                                            value={partySettings.taxRate}
                                            onChange={e => setPartySettings(p => ({ ...p, taxRate: parseFloat(e.target.value) }))}
                                            className="w-full accent-indigo-500"
                                        />
                                        <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                                            <span>0%</span><span>20%</span><span>40%</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSavePartySettings}
                                        disabled={savingSettings}
                                        className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-5 h-5" />
                                        {savingSettings ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </Card>

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
                                                <a
                                                    href={`https://percoco-pool.vercel.app/join/${group?.invite_code}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-3 py-2 font-mono font-bold text-primary hover:underline text-[10px] truncate flex items-center"
                                                >
                                                    percoco-pool.vercel.app/join/{group?.invite_code}
                                                </a>
                                                <Button type="button" className="px-4 py-2 text-xs shrink-0 rounded-xl"
                                                    onClick={() => {
                                                        const url = `https://percoco-pool.vercel.app/join/${group?.invite_code}`;
                                                        if (navigator.share) {
                                                            navigator.share({
                                                                title: 'Join my Pool Party Party',
                                                                text: `Join ${group?.name} on Pool Party Boss!`,
                                                                url
                                                            }).catch(() => {
                                                                navigator.clipboard.writeText(url);
                                                                toast.success('Copied!');
                                                            });
                                                        } else {
                                                            navigator.clipboard.writeText(url);
                                                            toast.success('Copied!');
                                                        }
                                                    }}>
                                                    Share Link
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                {/* Member Roster */}
                                <Card className="!p-6 sm:!p-10 shadow-3xl bg-zinc-900 border-white/10 rounded-[2.5rem] sm:rounded-[3rem] space-y-6 sm:space-y-8 relative overflow-hidden">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Member Command</p>
                                    <div className="space-y-2">
                                        {members.map((m: any) => (
                                            <div
                                                key={m.user_id}
                                                className="flex items-center justify-between p-4 bg-black rounded-2xl border border-white/5 group/member transition-all hover:border-primary/20 cursor-pointer active:bg-zinc-900 tap-highlight-transparent"
                                                onClick={() => handleViewIntel(m.user_id, m.display_name, m.profiles?.share_to_leaderboard === false)}
                                            >
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

                                {/* Delete Party */}
                                <div className="pt-4 border-t border-red-500/10">
                                    <button
                                        onClick={() => setShowDeletePartyModal(true)}
                                        className="w-full py-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 font-black text-sm uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Delete Party
                                    </button>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-700 text-center mt-3">This will permanently erase all shift history and members</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>


            <Modal isOpen={showGiphyPicker} onClose={() => setShowGiphyPicker(false)} title="Pick a Gif">
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <input
                            autoFocus
                            placeholder="Find memes or search..."
                            value={giphySearch}
                            onChange={(e) => setGiphySearch(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 pl-12 text-sm font-black text-white placeholder:text-zinc-600 focus:border-primary outline-none transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar pb-10">
                        {giphyLoading && giphyResults.length === 0 ? (
                            <div className="col-span-2 py-20 flex justify-center">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : giphyResults.length > 0 ? (
                            giphyResults.map((gif: any) => (
                                <button
                                    key={gif.id}
                                    type="button"
                                    onClick={() => {
                                        setPendingMedia({ url: gif.url, type: 'gif' })
                                        setShowGiphyPicker(false)
                                    }}
                                    className="relative h-[110px] sm:h-[130px] rounded-xl overflow-hidden hover:ring-2 ring-primary transition-all active:scale-95 bg-zinc-900 group border border-white/5 shadow-lg shrink-0"
                                >
                                    <img
                                        src={gif.url}
                                        alt={gif.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))
                        ) : !giphyLoading && (
                            <div className="col-span-2 py-20 text-center space-y-2">
                                <Search className="w-8 h-8 mx-auto text-zinc-800" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No memes found.</p>
                            </div>
                        )}
                        {giphyLoading && giphyResults.length > 0 && (
                            <div className="col-span-2 py-4 flex justify-center">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
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
                                                src={selectedUserIntel?.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserIntel?.userId}`}
                                                alt="avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <h3 className="font-black font-outfit text-2xl tracking-tighter text-white">
                                                {selectedUserIntel?.name}
                                            </h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-0.5">
                                                {group?.name} {selectedUserIntel?.userId === group?.owner_id ? 'Admin' : 'Member'}
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

                                        {selectedUserIntel?.profile?.phone && (
                                            <div className="w-full mt-2">
                                                <a href={`tel:${selectedUserIntel.profile.phone}`} className="w-full py-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center gap-2 group transition-all hover:bg-primary/20">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Line: {selectedUserIntel.profile.phone}</span>
                                                </a>
                                            </div>
                                        )}

                                        {selectedUserIntel?.profile?.bio && (
                                            <div className="mt-2 w-full p-4 bg-black/30 rounded-2xl border border-white/5 relative z-10">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Bio</p>
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

            {/* DELETE PARTY MODAL */}
            <Modal isOpen={showDeletePartyModal} onClose={() => setShowDeletePartyModal(false)} title="Delete Party?">
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-5 bg-red-500/5 border border-red-500/15 rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-black text-white">This cannot be undone.</p>
                            <p className="text-xs text-zinc-400 font-bold leading-relaxed">
                                All shift history, member data, and feed posts for <span className="text-white">{group?.name}</span> will be permanently erased. All members will lose access.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 text-center">Are you absolutely sure?</p>
                        <button
                            onClick={handleDeleteParty}
                            disabled={deletingParty}
                            className="w-full py-5 rounded-2xl bg-red-500 text-white font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            <Trash2 className="w-5 h-5" />
                            {deletingParty ? 'Dissolving...' : 'Yes, Permanently Delete'}
                        </button>
                        <button
                            onClick={() => setShowDeletePartyModal(false)}
                            className="w-full py-4 rounded-2xl bg-zinc-900 text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    )
}
