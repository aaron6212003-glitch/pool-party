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
import ShiftWrap from '@/components/ShiftWrap'
import { AnimatePresence } from 'framer-motion'

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
    const [supportStaffPresent, setSupportStaffPresent] = useState(true)

    const [supportPct, setSupportPct] = useState(0.05)
    const [taxRate, setTaxRate] = useState(0.15)
    const [tipOutLabel, setTipOutLabel] = useState('Support Pool')
    const [tipOutMode, setTipOutMode] = useState<'net_sales' | 'cc_tips'>('net_sales')
    const [groups, setGroups] = useState<any[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState('')
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [noParties, setNoParties] = useState(false)
    const [showWrap, setShowWrap] = useState(false)
    const [wrapData, setWrapData] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    // Helper for currency formatting with commas
    const formatCurrencyString = (val: string) => {
        const numeric = val.replace(/[^0-9.]/g, '')
        const parts = numeric.split('.')
        if (parts.length > 2) return val
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return parts.join('.')
    }

    const parseCurrencyString = (val: string) => {
        return val.replace(/,/g, '')
    }

    const nSales = parseFloat(parseCurrencyString(netSales)) || 0
    const nTips = parseFloat(tips) || 0
    const nCash = parseFloat(cashTips) || 0
    const h = parseInt(hoursVal) || 0
    const m = parseInt(minutesVal) || 0
    const nHours = h + (m / 60)

    const tipOutAmount = (nSales > 0 && supportStaffPresent)
        ? tipOutMode === 'cc_tips'
            ? (nTips * supportPct).toFixed(2)
            : (nSales * supportPct).toFixed(2)
        : '0.00'
    const grossTipsTotal = nTips + nCash
    const preTaxEarnings = grossTipsTotal - parseFloat(tipOutAmount)
    const postTaxEarnings = preTaxEarnings * (1 - taxRate)
    const hourlyRate = (nHours > 0) ? (preTaxEarnings / nHours).toFixed(2) : '0.00'
    const nWage = parseFloat(hourlyWage) || 0
    const wageEarnings = nWage * nHours
    const totalWithWage = preTaxEarnings + wageEarnings

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles').select('theme').eq('id', user.id).single()

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
        fetchData()
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

    useEffect(() => {
        if (shiftType === 'lunch') {
            setSupportStaffPresent(false)
        } else {
            setSupportStaffPresent(true)
        }
    }, [shiftType])

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGroupId) return toast.error("Please select a party first")
        if (!netSales) return toast.error("Please enter net sales")
        if (!tips && !cashTips) return toast.error("Log something!")
        if (nHours <= 0) return toast.error("Enter your hours.")
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
                    tipOutLabel,
                    supportStaffPresent
                },
                share_to_feed: true
            }).select('id').single()

            if (error) throw error

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#007AFF', '#5856D6', '#FF2D55']
            })

            toast.success("Shift Logs Updated! 🎉")

            const gradeInfo = calculateShiftGrade(nSales, nTips + nCash)

            setWrapData({
                totalEarned: totalWithWage,
                tipsPerHour: parseFloat(hourlyRate),
                netSales: nSales,
                hours: nHours,
                ccTips: nTips,
                cashTips: nCash,
                tipOut: parseFloat(tipOutAmount),
                basePay: wageEarnings,
                grade: gradeInfo.grade,
                gradeColor: gradeInfo.color,
                date: selectedDate,
                shiftType: shiftType
            })
            setShowWrap(true)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const currentMonth = getMonth(selectedDate)
    const currentDay = getDate(selectedDate)
    const currentYear = getYear(selectedDate)
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const years = [2024, 2025, 2026]
    const days = Array.from({ length: getDaysInMonth(selectedDate) }, (_, i) => i + 1)

    return (
        <div className="p-6 space-y-8 animate-in pb-32 max-w-lg mx-auto bg-black min-h-screen no-spinners">
            <header className="space-y-2 mt-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary opacity-90">New Shift</p>
                <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">New Shift.</h1>
            </header>

            <AnimatePresence>
                {showWrap && (
                    <ShiftWrap 
                        data={wrapData} 
                        onClose={() => router.push('/app/history')} 
                    />
                )}
            </AnimatePresence>

            {noParties && (
                <div className="py-16 text-center space-y-6 bg-zinc-900/30 border border-dashed border-white/5 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                        <UsersRound className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2 px-4">
                        <h2 className="text-2xl font-black font-outfit text-white tracking-tighter">Join a Party First.</h2>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">Join a party before logging shifts.</p>
                    </div>
                    <Link href="/app/groups" className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-2xl text-white font-black text-sm uppercase tracking-widest">Go to Parties</Link>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="!p-6 border-white/5 bg-zinc-900/40 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 font-outfit">
                            <CalendarIcon className="w-3 h-3" />
                            Date Selection
                        </span>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black tracking-[0.2em] uppercase">Calendar</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="relative group">
                            <select value={currentMonth} onChange={(e) => setSelectedDate(setMonth(selectedDate, parseInt(e.target.value)))} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-xs font-black font-outfit text-white appearance-none">
                                {months.map((m, i) => (<option key={m} value={i}>{m}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                        </div>
                        <div className="relative group">
                            <select value={currentDay} onChange={(e) => setSelectedDate(setDay(selectedDate, parseInt(e.target.value)))} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-xs font-black font-outfit text-white appearance-none">
                                {days.map(d => (<option key={d} value={d}>{d}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                        </div>
                        <div className="relative group">
                            <select value={currentYear} onChange={(e) => setSelectedDate(setYear(selectedDate, parseInt(e.target.value)))} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-xs font-black font-outfit text-white appearance-none">
                                {years.map(y => (<option key={y} value={y}>{y}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="!p-5 bg-zinc-900/60 border-white/5 rounded-[1.5rem]">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Work Party</label>
                        <select value={selectedGroupId} onChange={(e) => handleGroupChange(e.target.value)} className="w-full bg-transparent font-black font-outfit text-sm text-white appearance-none">
                            {groups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                        </select>
                    </Card>
                    <Card className="!p-5 bg-zinc-900/60 border-white/5 rounded-[1.5rem]">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Type</label>
                        <div className="flex bg-black/40 rounded-xl p-1">
                            {['lunch', 'dinner', 'double'].map((t) => (
                                <button key={t} type="button" onClick={() => setShiftType(t)} className={cn("flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all font-outfit", shiftType === t ? "bg-primary text-white" : "text-zinc-500")}>{t}</button>
                            ))}
                        </div>
                    </Card>
                </div>

                <Card className="!p-5 bg-zinc-900/60 border-white/5 rounded-[1.5rem]">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block">Support Staff</label>
                            <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-widest mt-0.5">Toggle off to remove {tipOutLabel}</p>
                        </div>
                        <button type="button" onClick={() => setSupportStaffPresent(!supportStaffPresent)} className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", supportStaffPresent ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                            {supportStaffPresent ? 'Present' : 'None'}
                        </button>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900/60 border-white/5 rounded-[1.5rem] space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-2"><Timer className="w-3.5 h-3.5" /> Session Duration</label>
                        <Badge className="bg-primary/10 text-primary border-none text-[9px] py-1">{h}h {m}m</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                            <span className="text-[9px] font-black text-zinc-700 uppercase">Hours</span>
                            <input type="number" placeholder="0" className="bg-transparent text-right text-2xl font-black font-outfit text-white w-12 outline-none" value={hoursVal} onChange={(e) => setHoursVal(e.target.value)} />
                        </div>
                        <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                            <span className="text-[9px] font-black text-zinc-700 uppercase">Mins</span>
                            <input type="number" placeholder="0" max="59" className="bg-transparent text-right text-2xl font-black font-outfit text-white w-12 outline-none" value={minutesVal} onChange={(e) => setMinutesVal(e.target.value)} />
                        </div>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                        <span className="text-[9px] font-black text-zinc-700 uppercase">Hourly Wage</span>
                        <input type="number" step="0.25" placeholder="0.00" className="bg-transparent text-right text-2xl font-black font-outfit text-white w-16 outline-none" value={hourlyWage} onChange={(e) => setHourlyWage(e.target.value)} />
                    </div>
                </Card>

                <Card className="space-y-10 !p-10 border-white/5 bg-zinc-900/40 rounded-[2.5rem]">
                    <div className="space-y-3 text-center">
                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Net Sales</label>
                        <input type="text" inputMode="decimal" placeholder="0.00" className="w-full text-center py-2 text-7xl font-black font-outfit bg-transparent text-white tracking-tighter" value={netSales} onChange={(e) => setNetSales(formatCurrencyString(e.target.value))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-10">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">CC Tips</label>
                            <input type="number" step="0.01" placeholder="0.00" className="w-full py-2 text-3xl font-black font-outfit bg-transparent text-white no-spinners" value={tips} onChange={(e) => setTips(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Cash Tips</label>
                            <input type="number" step="0.01" placeholder="0.00" className="w-full py-2 text-3xl font-black font-outfit bg-transparent text-white no-spinners" value={cashTips} onChange={(e) => setCashTips(e.target.value)} />
                        </div>
                    </div>
                </Card>

                <div className="pt-6 pb-20">
                    <Button type="submit" className="w-full text-2xl py-8 rounded-[2.5rem] font-outfit font-black" disabled={loading}>Log Shift</Button>
                </div>
            </form>

            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
                <div className="space-y-6 text-center">
                    <h3 className="text-3xl font-black font-outfit text-white tracking-tighter">Confirm Log.</h3>
                    <p className="text-sm text-zinc-400 font-outfit px-2">I confirm that the sales, tips, and hours entered for this shift are 100% accurate.</p>
                    <div className="flex flex-col gap-3 pt-4">
                        <Button onClick={confirmSave} className="w-full py-6 text-lg rounded-[2rem]">Log Shift</Button>
                        <button onClick={() => setShowConfirm(false)} className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Wait, go back</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
