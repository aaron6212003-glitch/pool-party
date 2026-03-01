"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Input, SectionTitle, GlassCard, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trophy, Group, Users, Settings, ChevronRight, TrendingUp, Filter, BarChart3, UserCircle, Crown, Info, Share2, MapPin, UsersRound, DollarSign, Wallet, RefreshCcw } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'

const LeaderboardItem = ({ name, value, rank, type, avatar }: { name: string, value: string, rank: number, type: string, avatar?: string }) => {
    const isTopThree = rank <= 3
    const rankColors = ['bg-[#FFD700]', 'bg-[#C0C0C0]', 'bg-[#CD7F32]']

    return (
        <Card className={cn(
            "p-5 py-4 flex items-center justify-between border-none shadow-2xl group active:scale-[0.98] transition-all bg-zinc-900/60 rounded-2xl",
            isTopThree ? 'ring-1 ring-primary/20' : ''
        )}>
            <div className="flex items-center gap-4">
                <div
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black font-outfit text-xs shadow-sm",
                        isTopThree ? rankColors[rank - 1] + " text-black" : "bg-black text-zinc-500"
                    )}
                >
                    {rank}
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black overflow-hidden ring-2 ring-primary/5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <p className="font-black font-outfit text-sm tracking-tight text-white">{name}</p>
                            {rank === 1 && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest opacity-60">{type}</p>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="font-black font-outfit text-xl tracking-tighter text-white">{value}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                    <TrendingUp className="w-2 h-2 text-primary" />
                    <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Verified</span>
                </div>
            </div>
        </Card>
    )
}

export default function GroupDetails() {
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

    const fetchGroupData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)

        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', id)
            .single()

        if (groupError) {
            toast.error("Could not find this party")
            router.push('/app/groups')
            return
        }
        setGroup(groupData)

        const { data: memberData } = await supabase
            .from('group_members')
            .select('user_id, display_name, profiles(avatar_url)')
            .eq('group_id', id)

        if (memberData) setMembers(memberData)

        const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
        const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]

        const { data: shifts } = await supabase
            .from('shift_entries')
            .select('user_id, net_sales, tips, computed_data, date')
            .eq('group_id', id)
            .gte('date', start)
            .lte('date', end)

        if (shifts) setRawShifts(shifts)
        setLoading(false)
        setRefreshing(false)
    }, [id, router, supabase])

    useEffect(() => {
        fetchGroupData()

        // Refresh when tab focused
        const handleFocus = () => fetchGroupData(true)
        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [fetchGroupData])

    useEffect(() => {
        if (members.length > 0) {
            const combined = members.map(member => {
                const memberShifts = rawShifts.filter(s => s.user_id === member.user_id)

                const totalSales = memberShifts.reduce((sum, s) => sum + parseFloat(s.net_sales || 0), 0)
                const totalTips = memberShifts.reduce((sum, s) => {
                    const cash = parseFloat(s.computed_data?.cashTips || 0)
                    const cc = parseFloat(s.tips || 0)
                    return sum + cash + cc
                }, 0)

                return {
                    name: member.display_name || 'Server',
                    sales: totalSales,
                    tips: totalTips,
                    avatar: (member.profiles as any)?.avatar_url
                }
            })

            const sorted = combined.sort((a, b) => {
                const valA = sortMetric === 'sales' ? a.sales : a.tips
                const valB = sortMetric === 'sales' ? b.sales : b.tips
                return valB - valA
            })

            setLeaderboard(sorted)
        }
    }, [rawShifts, members, sortMetric])

    const inviteUrl = (group?.invite_code && typeof window !== 'undefined')
        ? `${window.location.origin}/join/${group.invite_code}`
        : ''

    const handleCopyInvite = () => {
        if (!inviteUrl) return toast.error("Invite link not ready")

        if (!navigator.clipboard) {
            const textArea = document.createElement("textarea");
            textArea.value = inviteUrl;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                toast.success("Invite link copied!");
            } catch (err) {
                toast.error("Failed to copy link");
            }
            document.body.removeChild(textArea);
            return;
        }
        navigator.clipboard.writeText(inviteUrl)
        toast.success("Invite link copied!")
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh] bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-0 animate-in pb-32 bg-black min-h-screen">
            {/* Group Header */}
            <section className="bg-gradient-to-b from-zinc-900 to-black p-8 pt-16 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 bg-primary/20 blur-3xl rounded-full w-80 h-80 -mr-40 -mt-40"></div>
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-[0.4em]">
                            <UsersRound className="w-3 h-3" />
                            Management Center
                        </div>
                        <button
                            onClick={() => fetchGroupData(true)}
                            className={cn("p-2 rounded-full bg-white/5 text-zinc-500 hover:text-white transition-all", refreshing && "animate-spin text-primary")}
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>
                    <h1 className="text-4xl font-black font-outfit max-w-[90%] leading-[0.9] text-white tracking-tighter capitalize">{group?.name || 'Party Hub'}</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 overflow-hidden">
                            {members.slice(0, 5).map((m, i) => (
                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-zinc-900 overflow-hidden">
                                    <img src={(m.profiles as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.display_name}`} alt="member" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <Badge className="bg-white/5 text-zinc-500 backdrop-blur-md border border-white/5 !py-1.5 !px-3 font-black text-[9px] uppercase tracking-widest">{members.length} Members</Badge>
                    </div>
                </div>
            </section>

            {/* Navigation Tabs */}
            <div className="px-6 -mt-8 relative z-20">
                <div className="p-1.5 flex gap-1.5 bg-zinc-900/90 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl ring-1 ring-black/5">
                    {[
                        { id: 'leaderboard', icon: Trophy, label: 'Stats' },
                        { id: 'feed', icon: BarChart3, label: 'Feed' },
                        { id: 'settings', icon: Settings, label: 'Admin' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 py-3 px-2 rounded-2xl transition-all flex flex-col items-center justify-center font-outfit",
                                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            <tab.icon className="w-4 h-4 mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 pt-12 bg-black min-h-screen">
                {activeTab === 'leaderboard' && (
                    <div className="space-y-8 animate-in">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end px-1">
                                <div className="space-y-1">
                                    <h2 className="font-black font-outfit text-3xl tracking-tighter text-white">Ranking.</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 opacity-80">Week of {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')}</p>
                                </div>

                                {/* Metric Filter Toggle */}
                                <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setSortMetric('sales')}
                                        className={cn(
                                            "p-2 px-3 rounded-lg flex items-center gap-2 transition-all",
                                            sortMetric === 'sales' ? "bg-primary text-white shadow-lg" : "text-zinc-600"
                                        )}
                                    >
                                        <DollarSign className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Sales</span>
                                    </button>
                                    <button
                                        onClick={() => setSortMetric('tips')}
                                        className={cn(
                                            "p-2 px-3 rounded-lg flex items-center gap-2 transition-all",
                                            sortMetric === 'tips' ? "bg-primary text-white shadow-lg" : "text-zinc-600"
                                        )}
                                    >
                                        <Wallet className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Tips</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((player, i) => (
                                    <LeaderboardItem
                                        key={player.name}
                                        name={player.name}
                                        value={`$${(sortMetric === 'sales' ? player.sales : player.tips).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                        rank={i + 1}
                                        type={sortMetric === 'sales' ? "Weekly Net Sales" : "Weekly Gross Tips"}
                                        avatar={player.avatar}
                                    />
                                ))
                            ) : (
                                <div className="py-24 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5">
                                    <Trophy className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                                    <h3 className="font-black font-outfit text-xl text-white">Board Empty</h3>
                                    <p className="text-xs text-zinc-600 uppercase font-black tracking-widest mt-1">First shift pending</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-2">Algorithm Reset</p>
                            <p className="text-sm font-black font-outfit text-white uppercase tracking-widest">Monday @ 4:00 AM EST</p>
                        </div>
                    </div>
                )}

                {activeTab === 'feed' && (
                    <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 animate-in">
                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 flex items-center justify-center text-primary/20 border border-white/5 shadow-2xl">
                            <BarChart3 className="w-12 h-12" />
                        </div>
                        <h3 className="font-black font-outfit text-2xl text-white tracking-tighter">Live Feed Coming Soon</h3>
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] max-w-[200px] mx-auto leading-relaxed">Real-time notifications & team chatter are in development.</p>
                        <Badge className="bg-zinc-900 text-zinc-800 border-none font-black text-[8px] uppercase tracking-[0.2em] py-2.5 px-6 mt-4">Release v1.2</Badge>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in">
                        <div className="space-y-1">
                            <h2 className="font-black font-outfit text-3xl tracking-tighter text-white px-1">Admin.</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 opacity-80 px-1">Manage performance thresholds</p>
                        </div>

                        <Card className="space-y-10 !p-10 shadow-3xl border-white/5 bg-zinc-900/60 rounded-[2.5rem]">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Share2 className="w-4 h-4" />
                                    </div>
                                    <p className="font-black font-outfit text-xs text-white uppercase tracking-[0.2em]">Quick Invite Link</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1 p-4 bg-black rounded-2xl text-[10px] font-mono border border-white/10 truncate text-primary font-black flex items-center overflow-x-auto min-h-[50px]">
                                        {inviteUrl || 'Generating link...'}
                                    </div>
                                    <Button variant="secondary" onClick={handleCopyInvite} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest shrink-0 shadow-sm rounded-2xl" disabled={!inviteUrl}>Copy</Button>
                                </div>
                                <p className="text-[9px] text-zinc-600 font-bold text-center uppercase tracking-widest opacity-60">Invite link code: <span className="text-white">{group?.invite_code || '---'}</span></p>
                            </div>

                            <div className="border-t border-white/5 pt-10 space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <p className="font-black font-outfit text-xs text-white uppercase tracking-[0.2em]">Configuration</p>
                                </div>
                                <div className="space-y-8">
                                    <Input label="Group Tip out Rate (%)" defaultValue={(group?.settings?.supportPct * 100).toFixed(0)} type="number" />
                                    <div className="flex items-center justify-between p-6 bg-black rounded-3xl border border-white/10">
                                        <div>
                                            <p className="text-sm font-black font-outfit text-white tracking-tight">Stealth Display</p>
                                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1">Protect identity from outsiders</p>
                                        </div>
                                        <div className="w-12 h-7 bg-primary rounded-full relative shadow-inner">
                                            <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
