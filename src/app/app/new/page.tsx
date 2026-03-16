"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, Button, SectionTitle, GlassCard, Badge, cn, Modal } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Calculator, Save, DollarSign, Calendar as CalendarIcon, Clock, ChevronDown, UserCircle, Banknote, Timer, Info, UsersRound, LayoutGrid } from 'lucide-react'
import confetti from 'canvas-confetti'
import { format, eachDayOfInterval, subDays, isSameDay, getDaysInMonth, setMonth, setDate as setDay, setYear, getYear, getMonth, getDate, startOfWeek, endOfWeek } from 'date-fns'
import { calculateShiftGrade } from '@/lib/calculations'

export default function NewShiftEntry() {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [shiftType, setShiftType] = useState('dinner')
    const [netSales, setNetSales] = useState('')
    const [tips, setTips] = useState('')
    const [cashTips, setCashTips] = useState('')

    // Duration as Hours and Minutes
    const [hoursVal, setHoursVal] = useState('')
    const [minutesVal, setMinutesVal] = useState('')
    const [hourlyWage, setHourlyWage] = useState('')

    const [supportPct, setSupportPct] = useState(0.05)
    const [taxRate, setTaxRate] = useState(0.15)
    const [tipOutLabel, setTipOutLabel] = useState('Support Pool')
    const [tipOutMode, setTipOutMode] = useState<'net_sales' | 'cc_tips'>('net_sales')
    const [groups, setGroups] = useState<any[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState('')
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [noParties, setNoParties] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Helper for currency formatting with commas
    const formatCurrencyString = (val: string) => {
        // Remove non-numeric characters except decimal
        const numeric = val.replace(/[^0-9.]/g, '')
        const parts = numeric.split('.')
        if (parts.length > 2) return val // Prevent multiple decimals

        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return parts.join('.')
    }

    const parseCurrencyString = (val: string) => {
        return val.replace(/,/g, '')
    }

    // CALCULATIONS
    const nSales = parseFloat(parseCurrencyString(netSales)) || 0
    const nTips = parseFloat(tips) || 0
    const nCash = parseFloat(cashTips) || 0

    const h = parseInt(hoursVal) || 0
    const m = parseInt(minutesVal) || 0
    const nHours = h + (m / 60)

    const tipOutAmount = nSales > 0
        ? tipOutMode === 'cc_tips'
            ? (nTips * supportPct).toFixed(2)
            : (nSales * supportPct).toFixed(2)
        : '0.00'
    const grossTipsTotal = nTips + nCash
    const preTaxEarnings = grossTipsTotal - parseFloat(tipOutAmount)
    const postTaxEarnings = preTaxEarnings * (1 - taxRate) // dynamic tax
    const hourlyRate = (nHours > 0) ? (preTaxEarnings / nHours).toFixed(2) : '0.00'
    const nWage = parseFloat(hourlyWage) || 0
    const wageEarnings = nWage * nHours
    const totalWithWage = preTaxEarnings + wageEarnings

    useEffect(() => {
        const fetchGroups = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('group_members')
                .select('group_id, groups(id, name, settings)')
                .eq('user_id', user.id)

            if (!error && data) {
                const fetchedGroups = data.map((item: any) => item.groups).filter(Boolean)
                setGroups(fetchedGroups)
                if (fetchedGroups.length > 0) {
                    setSelectedGroupId(fetchedGroups[0].id)
                    const s = fetchedGroups[0].settings || {}
                    setSupportPct(s.supportPct ?? 0.05)
                    setTaxRate(s.taxRate ?? 0.15)
                    setTipOutLabel(s.tipOutLabel || 'Support Pool')
                    setTipOutMode(s.tipOutMode || 'net_sales')
                } else {
                    setNoParties(true)
                }
            }
        }
        fetchGroups()
    }, [])

    const handleGroupChange = (id: string) => {
        setSelectedGroupId(id)
        const g = groups.find(x => x.id === id)
        if (g) {
            const s = g.settings || {}
            setSupportPct(s.supportPct ?? 0.05)
            setTaxRate(s.taxRate ?? 0.15)
            setTipOutLabel(s.tipOutLabel || 'Support Pool')
            setTipOutMode(s.tipOutMode || 'net_sales')
        }
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGroupId) return toast.error("Please select a party first")
        if (!netSales) return toast.error("Please enter net sales")
        if (!tips && !cashTips) return toast.error("Did you make $0? If so, bless your heart, but log something.")
        if (nHours <= 0) return toast.error("Time travel isn't supported yet. Please enter your hours.")

        setShowConfirm(true)
    }

    const confirmSave = async () => {
        setShowConfirm(false)
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not logged in")

            const { data: insertedShift, error } = await supabase.from('shift_entries').insert({
                user_id: user.id,
                group_id: selectedGroupId,
                date: format(selectedDate, 'yyyy-MM-dd'),
                shift_type: shiftType,
                net_sales: nSales,
                tips: nTips,
                hours: nHours,
                computed_data: {
                    supportPool: tipOutAmount,
                    cashTips: nCash,
                    hourlyRate: parseFloat(hourlyRate),
                    hourlyWage: nWage || null,
                    wageEarnings: nWage > 0 ? wageEarnings : null,
                    rawTime: { h, m },
                    taxRate,
                    tipOutMode,
                    tipOutLabel
                },
                share_to_feed: true
            }).select('id').single()

            if (error) throw error

            // Trigger settlement for any open bets resting on this shift
            try {
                await fetch('/api/sportsbook/settle', { method: 'POST' })
            } catch (e) {
                console.error('Settlement trigger failed:', e)
            }

            // ── SYSTEM FEED EVENTS ── 
            if (selectedGroupId) {
                try {
                    const { data: profile } = await supabase.from('group_members').select('display_name').eq('user_id', user.id).eq('group_id', selectedGroupId).single()
                    const name = profile?.display_name || 'A server'

                    const { data: pastShifts } = await supabase.from('shift_entries').select('id, net_sales, tips, computed_data').eq('user_id', user.id)

                    let isSalesPR = false
                    let isTipsPR = false

                    if (pastShifts && pastShifts.length > 1) { // more than just the current shift
                        const historicalShifts = pastShifts.filter((s: any) => s.id !== insertedShift?.id)
                        const maxSales = Math.max(...historicalShifts.map((s: any) => parseFloat(s.net_sales || 0)))
                        const maxTips = Math.max(...historicalShifts.map((s: any) => parseFloat(s.tips || 0) + parseFloat(s.computed_data?.cashTips || 0) + parseFloat(s.computed_data?.wageEarnings || 0)))

                        const currentTips = nTips + nCash + (nWage > 0 ? wageEarnings : 0)

                        if (nSales > maxSales) isSalesPR = true
                        if (currentTips > maxTips) isTipsPR = true
                    }

                    const gradeInfo = calculateShiftGrade(nSales, nTips + nCash) // only factoring actual tips for grade
                    const feedEvents = []

                    if (isSalesPR) {
                        feedEvents.push({
                            group_id: selectedGroupId,
                            user_id: user.id,
                            event_type: 'system',
                            content: `🚨 **${name}** just set an all-time Personal Best for Sales: **$${nSales.toFixed(0)}**!`,
                            metadata: { type: 'pr_sales' },
                            is_anonymous: false
                        })
                    }

                    if (isTipsPR) {
                        const currentTips = nTips + nCash + (nWage > 0 ? wageEarnings : 0)
                        feedEvents.push({
                            group_id: selectedGroupId,
                            user_id: user.id,
                            event_type: 'system',
                            content: `💰 **${name}** just hit an all-time Personal Best for Takehome: **$${currentTips.toFixed(0)}**!`,
                            metadata: { type: 'pr_tips' },
                            is_anonymous: false
                        })
                    }

                    if (gradeInfo.grade === 'A+' || gradeInfo.grade === 'A') {
                        feedEvents.push({
                            group_id: selectedGroupId,
                            user_id: user.id,
                            event_type: 'system',
                            content: `🔥 **${name}** crushed it tonight. Logged an **${gradeInfo.grade}** shift.`,
                            metadata: { type: 'grade_a', grade: gradeInfo.grade, color: gradeInfo.color },
                            is_anonymous: false
                        })
                    }

                    if (feedEvents.length > 0) {
                        await supabase.from('party_feed').insert(feedEvents)
                    }
                } catch (feedErr) {
                    console.error("Failed to post automated feed events", feedErr)
                }
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#007AFF', '#5856D6', '#FF2D55']
            })

            toast.success("Intelligence Logs Updated! 🎉")

            // ── ACHIEVEMENTS ──
            if (selectedGroupId) {
                await checkAchievements(user.id, selectedGroupId, {
                    sales: nSales,
                    tips: nTips + nCash,
                    date: selectedDate,
                    shiftType: shiftType,
                    duration: nHours
                })
            }

            router.push('/app')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }
    const checkAchievements = async (userId: string, groupId: string, currentShift: any) => {
        try {
            // Get existing achievements to avoid duplicates
            const { data: existing } = await supabase
                .from('user_achievements')
                .select('achievement_type')
                .eq('user_id', userId)
                .eq('group_id', groupId)

            const unlockedTypes = new Set(existing?.map((a: any) => a.achievement_type) || [])
            const newAchievements: string[] = []

            // 1. Whale Hunter ($2,500+ Sales)
            if (!unlockedTypes.has('whale_hunter') && currentShift.sales >= 2500) {
                newAchievements.push('whale_hunter')
            }

            // 2. Tip Monarch ($500+ in tips)
            if (!unlockedTypes.has('tip_king') && currentShift.tips >= 500) {
                newAchievements.push('tip_king')
            }

            // 3. Marathoner (Shift > 10 hours)
            if (!unlockedTypes.has('marathoner') && currentShift.duration >= 10) {
                newAchievements.push('marathoner')
            }

            // Weekend Warrior is now competitive - handled below

            // For frequency-based ones, we need historical data
            const { data: history } = await supabase
                .from('shift_entries')
                .select('date, shift_type')
                .eq('user_id', userId)
                .eq('group_id', groupId)

            if (history) {
                // 5. Legendary (50 Total Shifts)
                if (!unlockedTypes.has('legendary') && history.length >= 50) {
                    newAchievements.push('legendary')
                }

                // 6. On Fire (5+ Shifts in 7 days)
                if (!unlockedTypes.has('on_fire')) {
                    const last7Days = history.filter((s: any) => {
                        const sDate = new Date(s.date)
                        const diff = (new Date().getTime() - sDate.getTime()) / (1000 * 3600 * 24)
                        return diff <= 7
                    })
                    if (last7Days.length >= 5) newAchievements.push('on_fire')
                }
            }

            // Award New Achievements
            if (newAchievements.length > 0) {
                const { data: profile } = await supabase.from('group_members').select('display_name').eq('user_id', userId).eq('group_id', groupId).single()
                const name = profile?.display_name || 'A server'

                for (const type of newAchievements) {
                    await supabase.from('user_achievements').insert({
                        user_id: userId,
                        group_id: groupId,
                        achievement_type: type
                    })

                    // Get label for feed
                    const label = ({
                        'whale_hunter': '🏹 Whale Hunter',
                        'tip_king': '💰 Tip Monarch',
                        'marathoner': '👟 Marathoner',
                        'on_fire': '🔥 On Fire',
                        'legendary': '💎 Legendary'
                    } as any)[type]

                    if (label) {
                        await supabase.from('party_feed').insert({
                            group_id: groupId,
                            user_id: userId,
                            event_type: 'system',
                            content: `🎖️ **${name}** has just been awarded the **${label}** medal!`,
                            metadata: { type: 'achievement_unlocked', achievement: type }
                        })

                        toast(`Medal Earned: ${label}! 🎖️`, {
                            description: "Check your Medal Rack in the party hub."
                        })
                    }
                }
            }

            // ── WEEKEND WARRIOR COMPETITIVE CHECK (Fri-Sun Hours) ──
            const day = currentShift.date.getDay()
            if (day === 5 || day === 6 || day === 0) {
                const weekStart = format(startOfWeek(currentShift.date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                const weekEnd = format(endOfWeek(currentShift.date, { weekStartsOn: 1 }), 'yyyy-MM-dd')

                const { data: weekShifts } = await supabase
                    .from('shift_entries')
                    .select('user_id, duration, date')
                    .eq('group_id', groupId)
                    .gte('date', weekStart)
                    .lte('date', weekEnd)

                if (weekShifts) {
                    const totals: Record<string, number> = {}
                    weekShifts.forEach((s: any) => {
                        const sd = new Date(s.date).getDay()
                        if (sd === 5 || sd === 6 || sd === 0) {
                            totals[s.user_id] = (totals[s.user_id] || 0) + (parseFloat(s.duration) || 0)
                        }
                    })

                    let maxOthers = 0
                    Object.entries(totals).forEach(([uid, hrs]) => {
                        if (uid !== userId && hrs > maxOthers) maxOthers = hrs
                    })

                    const myTotal = totals[userId] || 0
                    if (myTotal > maxOthers && myTotal > 0) {
                        const prevTotal = myTotal - (currentShift.duration || 0)
                        const tookLead = prevTotal <= maxOthers

                        if (tookLead) {
                            const { data: profile } = await supabase.from('group_members').select('display_name').eq('user_id', userId).eq('group_id', groupId).single()
                            const dispName = profile?.display_name || 'A server'

                            await supabase.from('party_feed').insert({
                                group_id: groupId,
                                user_id: userId,
                                event_type: 'system',
                                content: `**${dispName}** just TOOK the lead as the **Weekend Warrior** with **${myTotal.toFixed(1)}** total hours! ⚡`,
                                metadata: { type: 'weekend_warrior_lead', hours: myTotal }
                            })
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Achievement check failed:", e)
        }
    }

    // Date part helpers
    const currentMonth = getMonth(selectedDate)
    const currentDay = getDate(selectedDate)
    const currentYear = getYear(selectedDate)

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    const years = [2024, 2025, 2026]
    const days = Array.from({ length: getDaysInMonth(selectedDate) }, (_, i) => i + 1)

    return (
        <div className="p-6 space-y-8 animate-in pb-32 max-w-lg mx-auto bg-black min-h-screen no-spinners">
            <header className="space-y-2 mt-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary opacity-90">Session Intelligence</p>
                <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">New Shift.</h1>
            </header>

            {noParties && (
                <div className="py-16 text-center space-y-6 bg-zinc-900/30 border border-dashed border-white/5 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                        <UsersRound className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2 px-4">
                        <h2 className="text-2xl font-black font-outfit text-white tracking-tighter">Join a Party First.</h2>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                            You need to be in a party before logging shifts. Ask your manager for an invite code.
                        </p>
                    </div>
                    <Link href="/app/groups"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                    >
                        <LayoutGrid className="w-5 h-5" />
                        Go to Parties
                    </Link>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">

                {/* DATE SELECTOR DROPDOWNS */}
                <Card className="!p-6 border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 font-outfit">
                            <CalendarIcon className="w-3 h-3" />
                            Date Selection
                        </span>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black tracking-[0.2em] uppercase">Calendar</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {/* Month */}
                        <div className="relative group">
                            <select
                                value={currentMonth}
                                onChange={(e) => setSelectedDate(setMonth(selectedDate, parseInt(e.target.value)))}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-xs font-black font-outfit text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                            >
                                {months.map((m, i) => (
                                    <option key={m} value={i}>{m}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-hover:text-primary transition-colors pointer-events-none" />
                        </div>

                        {/* Day */}
                        <div className="relative group">
                            <select
                                value={currentDay}
                                onChange={(e) => setSelectedDate(setDay(selectedDate, parseInt(e.target.value)))}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-xs font-black font-outfit text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                            >
                                {days.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-hover:text-primary transition-colors pointer-events-none" />
                        </div>

                        {/* Year */}
                        <div className="relative group">
                            <select
                                value={currentYear}
                                onChange={(e) => setSelectedDate(setYear(selectedDate, parseInt(e.target.value)))}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-xs font-black font-outfit text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-hover:text-primary transition-colors pointer-events-none" />
                        </div>
                    </div>
                </Card>

                {/* PARTY & SHIFT TYPE */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="!p-5 bg-zinc-900/60 border-white/5 shadow-xl space-y-2 rounded-[1.5rem]">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Work Party</label>
                        <div className="relative group">
                            <select
                                value={selectedGroupId}
                                onChange={(e) => handleGroupChange(e.target.value)}
                                className="w-full bg-transparent font-black font-outfit text-sm text-white appearance-none focus:outline-none cursor-pointer"
                            >
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-hover:text-primary transition-colors pointer-events-none" />
                        </div>
                    </Card>

                    <Card className="!p-5 bg-zinc-900/60 border-white/5 shadow-xl space-y-2 rounded-[1.5rem]">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Type</label>
                        <div className="flex bg-black/40 rounded-xl p-1">
                            {['lunch', 'dinner', 'double'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setShiftType(t)}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all font-outfit",
                                        shiftType === t ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-zinc-400"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* DURATION PICKER */}
                <Card className="p-6 bg-zinc-900/60 border-white/5 shadow-xl space-y-4 rounded-[1.5rem]">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-2">
                            <Timer className="w-3.5 h-3.5" />
                            Session Duration
                        </label>
                        <Badge className="bg-primary/10 text-primary border-none text-[9px] py-1">{h}h {m}m</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-between border border-white/5 group hover:border-primary/30 transition-all">
                            <span className="text-[9px] font-black text-zinc-700 uppercase">Hours</span>
                            <input type="number" placeholder="0" className="bg-transparent text-right text-2xl font-black font-outfit text-white w-12 outline-none" value={hoursVal} onChange={(e) => setHoursVal(e.target.value)} />
                        </div>
                        <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-between border border-white/5 group hover:border-primary/30 transition-all">
                            <span className="text-[9px] font-black text-zinc-700 uppercase">Mins</span>
                            <input type="number" placeholder="0" max="59" className="bg-transparent text-right text-2xl font-black font-outfit text-white w-12 outline-none" value={minutesVal} onChange={(e) => setMinutesVal(e.target.value)} />
                        </div>
                    </div>
                    {/* Hourly Wage */}
                    <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-between border border-white/5 group hover:border-primary/30 transition-all">
                        <div>
                            <span className="text-[9px] font-black text-zinc-700 uppercase">Hourly Wage</span>
                            <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-widest">Optional</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-zinc-700 text-sm font-black font-outfit">$</span>
                            <input type="number" step="0.25" placeholder="0.00" className="bg-transparent text-right text-2xl font-black font-outfit text-white w-16 outline-none" value={hourlyWage} onChange={(e) => setHourlyWage(e.target.value)} />
                        </div>
                    </div>
                </Card>

                {/* THE CORE NUMBERS */}
                <Card className="space-y-10 !p-10 shadow-3xl border-white/5 relative overflow-hidden bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem]">
                    <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
                        <DollarSign className="w-64 h-64 text-primary" />
                    </div>

                    <div className="space-y-3 relative z-10 text-center">
                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-primary block">Net Sales</label>
                        <div className="relative inline-flex items-center w-full">
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="w-full text-center py-2 text-7xl font-black font-outfit bg-transparent focus:outline-none placeholder:text-zinc-800 transition-all text-white tracking-tighter"
                                value={netSales}
                                onChange={(e) => setNetSales(formatCurrencyString(e.target.value))}
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 relative z-10 border-t border-white/5 pt-10">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">CC Tips</label>
                            <div className="relative group">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-700 font-outfit group-focus-within:text-primary transition-colors">$</span>
                                <input type="number" step="0.01" placeholder="0.00" className="w-full pl-4 pr-0 py-2 text-3xl font-black font-outfit bg-transparent border-none focus:outline-none text-white no-spinners" value={tips} onChange={(e) => setTips(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Cash Tips</label>
                            <div className="relative group">
                                <Banknote className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-700 w-4 h-4 group-focus-within:text-primary transition-colors" />
                                <input type="number" step="0.01" placeholder="0.00" className="w-full pl-6 pr-0 py-2 text-3xl font-black font-outfit bg-transparent border-none focus:outline-none text-white no-spinners" value={cashTips} onChange={(e) => setCashTips(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* CALCULATION SUMMARY */}
                <div className="relative group">
                    <div className="absolute -inset-1 rounded-[2rem] bg-primary/10 blur-xl opacity-30"></div>
                    <Card className="relative !p-8 bg-zinc-900 border border-white/5 rounded-[2rem] shadow-2xl space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Calculator className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Projected Earnings</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-500">
                                <span>Gross Tips Total</span>
                                <span className="text-white">${grossTipsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-500">
                                <span>{tipOutLabel} ({(supportPct * 100).toFixed(1)}%{tipOutMode === 'cc_tips' ? ' of CC Tips' : ' of Net Sales'})</span>
                                <span className="text-red-500">-${parseFloat(tipOutAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-white uppercase tracking-tighter">Pre-Tax Shift Earnings</p>
                                    <div className="flex items-center gap-2 text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                                        <span>Formula: Tips - Tip out</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-black font-outfit text-white">${preTaxEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-primary/20 bg-primary/5 p-4 rounded-xl">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Post-Tax ({(taxRate * 100).toFixed(0)}%)</p>
                                    <p className="text-[8px] text-primary/60 font-black uppercase tracking-widest">Takehome Estimate</p>
                                </div>
                                <p className="text-3xl font-black font-outfit text-primary">${postTaxEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        {nWage > 0 && nHours > 0 && (
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-500">
                                <span>Base Pay ({nHours.toFixed(1)}h × ${nWage}/hr)</span>
                                <span className="text-emerald-400">+${wageEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        {nHours > 0 && (
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Timer className="w-3 h-3 text-indigo-400" />
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tip Hourly Rate:</span>
                                </div>
                                <span className="text-lg font-black font-outfit text-indigo-400">${hourlyRate}/hr</span>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="pt-6 pb-20">
                    <Button type="submit" className="w-full text-2xl py-8 shadow-3xl shadow-primary/30 flex items-center justify-center gap-4 active:scale-[0.97] transition-all bg-primary hover:bg-primary/95 text-white border-none rounded-[2.5rem] font-outfit font-black" disabled={loading}>
                        <Save className="w-8 h-8" />
                        {loading ? "Capturing..." : "Log Shift"}
                    </Button>
                </div>
            </form>

            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
                <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-primary/5">
                        <Save className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black font-outfit text-white tracking-tighter">Confirm Log.</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Final Verification</p>
                    </div>
                    <p className="text-sm font-medium text-zinc-400 leading-relaxed font-outfit px-2">
                        I confirm that the sales, tips, and hours entered for this shift are 100% accurate.
                        <br /><br />
                        <span className="text-xs text-zinc-600 font-black uppercase tracking-widest leading-loose">Acknowledge shift integrity to continue.</span>
                    </p>
                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={confirmSave}
                            className="w-full py-6 text-lg rounded-[2rem] shadow-2xl shadow-primary/20"
                        >
                            Log Shift
                        </Button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-colors py-2"
                        >
                            Wait, go back
                        </button>
                    </div>
                </div>
            </Modal>

            <style jsx>{`
                .no-spinners input::-webkit-outer-spin-button,
                .no-spinners input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .no-spinners input[type=number] {
                    -moz-appearance: textfield;
                }
                select option { background: #09090b; color: white; }
            `}</style>
        </div>
    )
}
