"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Badge, Button, Modal, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { Plus, LayoutGrid, Calendar, ChevronRight, Wallet, Trash2, AlertCircle, Info, Calculator, Banknote } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { toast } from 'sonner'

export default function Dashboard() {
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState({
        netSales: 0,
        tipOutPaid: 0,
        hours: 0,
        ccTips: 0,
        cashTips: 0,
        grossTips: 0,
        wageEarnings: 0,
    })
    const [recentShifts, setRecentShifts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteModalKey, setDeleteModalKey] = useState<string | null>(null)
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [paycheckExpanded, setPaycheckExpanded] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const supabase = createClient()

    const fetchDashboardData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUser(user)

        // Load avatar from profiles table (source of truth)
        const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()
        if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url)

        const today = new Date()
        const start = startOfWeek(today, { weekStartsOn: 1 }).toISOString().split('T')[0]
        const end = endOfWeek(today, { weekStartsOn: 1 }).toISOString().split('T')[0]

        const { data: weeklyEntries } = await supabase
            .from('shift_entries')
            .select('net_sales, tips, hours, computed_data')
            .eq('user_id', user.id)
            .gte('date', start)
            .lte('date', end)

        if (weeklyEntries) {
            const totals = (weeklyEntries as any[]).reduce((acc: any, curr) => {
                const tipOut = parseFloat(curr.computed_data?.supportPool || 0)
                const cash = parseFloat(curr.computed_data?.cashTips || 0)
                const cc = parseFloat(curr.tips || 0)
                const wage = parseFloat(curr.computed_data?.wageEarnings || 0)
                return {
                    netSales: acc.netSales + (parseFloat(curr.net_sales) || 0),
                    tipOutPaid: acc.tipOutPaid + tipOut,
                    hours: acc.hours + (parseFloat(curr.hours) || 0),
                    ccTips: acc.ccTips + cc,
                    cashTips: acc.cashTips + cash,
                    grossTips: acc.grossTips + cc + cash,
                    wageEarnings: acc.wageEarnings + wage,
                }
            }, { netSales: 0, tipOutPaid: 0, hours: 0, ccTips: 0, cashTips: 0, grossTips: 0, wageEarnings: 0 })
            setStats(totals)
        }

        const { data: recent } = await supabase
            .from('shift_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(3)

        if (recent) setRecentShifts(recent)
        setLoading(false)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const handleDeleteShift = async () => {
        if (!deleteModalKey) return
        setIsDeleting(true)
        try {
            const { error } = await supabase.from('shift_entries').delete().eq('id', deleteModalKey)
            if (error) throw error
            toast.success("Shift records purged.")
            setDeleteModalKey(null)
            fetchDashboardData()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsDeleting(false)
        }
    }

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Server'

    // PAYCHECK CALCULATIONS
    const preTaxCheck = (stats.ccTips + stats.wageEarnings) - stats.tipOutPaid
    const estimatedTax = preTaxCheck * 0.15
    const digitalDeposit = Math.max(0, preTaxCheck - estimatedTax)
    const cashInHand = stats.cashTips
    const totalTakehome = digitalDeposit + cashInHand

    const selectedShift = recentShifts.find((s: any) => s.id === selectedShiftId)

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh] bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-6 pt-safe space-y-8 animate-in pb-40 bg-black min-h-screen">
            <header className="flex justify-between items-center mt-6 px-1">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary opacity-70">Intelligence OS</p>
                    <h1 className="text-3xl font-black font-outfit text-white tracking-tighter capitalize">G'day, {firstName}</h1>
                </div>
                <Link href="/app/settings" className="relative group">
                    <div className="absolute -inset-1 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-11 h-11 rounded-full bg-zinc-900 border border-white/10 overflow-hidden ring-2 ring-white/5 relative z-10 shadow-xl">
                        <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                </Link>
            </header>

            {/* QUICK STATS HUD */}
            <section className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl text-center space-y-1">
                    <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Weekly Sales</p>
                    <p className="text-lg font-black font-outfit text-white leading-none">${stats.netSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl text-center space-y-1">
                    <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Gross Tips</p>
                    <p className="text-lg font-black font-outfit text-white leading-none">${stats.grossTips.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl text-center space-y-1">
                    <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Hours</p>
                    <p className="text-lg font-black font-outfit text-white leading-none">
                        {Math.floor(stats.hours)}h {Math.round((stats.hours % 1) * 60)}m
                    </p>
                </div>
            </section>

            {/* PAYCHECK ESTIMATOR */}
            <section>
                <div className="relative">
                    <div className="absolute -inset-1 rounded-[2.5rem] blur-3xl bg-primary/20 opacity-30 pointer-events-none"></div>
                    <Card className="relative !p-0 bg-zinc-900 border-white/10 rounded-[2.5rem] shadow-3xl overflow-hidden">

                        {/* Tappable header */}
                        <button
                            onClick={() => setPaycheckExpanded(e => !e)}
                            className="w-full text-left p-10 pb-8 relative"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Banknote className="w-48 h-48" />
                            </div>
                            <div className="space-y-2 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Expected Deposit</span>
                                    </div>
                                    <Badge className={cn("border-none text-[8px] font-black uppercase tracking-widest transition-colors", paycheckExpanded ? "bg-primary/20 text-primary" : "bg-white/5 text-zinc-600")}>
                                        {paycheckExpanded ? 'Hide' : 'Breakdown'}
                                    </Badge>
                                </div>
                                <h2 className="text-7xl font-black font-outfit text-white tracking-tighter leading-none">
                                    ${Math.floor(digitalDeposit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </h2>
                                <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest pt-1">Excludes cash in hand · resets Monday</p>
                            </div>
                        </button>

                        {/* Expandable detail breakdown */}
                        {paycheckExpanded && (
                            <div className="border-t border-white/5 p-8 pt-6 space-y-3 bg-black/40">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4">This Week's Breakdown</p>

                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-zinc-500">CC Tips</span>
                                        <span className="text-xs font-black text-white font-outfit">+${stats.ccTips.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-zinc-500">Cash Tips</span>
                                        <span className="text-xs font-black text-emerald-400 font-outfit">+${stats.cashTips.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    {stats.wageEarnings > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-zinc-500">Base Wage</span>
                                            <span className="text-xs font-black text-emerald-400 font-outfit">+${stats.wageEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-red-500/80">Tip Out Paid</span>
                                        <span className="text-xs font-black text-red-500 font-outfit">-${stats.tipOutPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                    <span className="text-xs font-black text-white uppercase tracking-tighter">Pre-Tax Check</span>
                                    <span className="text-lg font-black text-white font-outfit">${preTaxCheck.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-zinc-600 italic">Est. 15% Tax</span>
                                    <span className="text-xs font-black text-indigo-400 font-outfit">-${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mt-2">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Expected Deposit</p>
                                        <p className="text-[8px] font-bold text-indigo-400/50 uppercase tracking-widest mt-0.5">Excludes Cash</p>
                                    </div>
                                    <p className="text-3xl font-black text-indigo-400 font-outfit">${digitalDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500/80 mb-1">Total Takehome</p>
                                        <p className="text-lg font-black font-outfit text-emerald-400">${totalTakehome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <p className="text-[7px] font-bold text-emerald-900 uppercase tracking-widest mt-0.5">Check + Cash</p>
                                    </div>
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-400/80 mb-1">Cash in Hand</p>
                                        <p className="text-lg font-black font-outfit text-amber-400">${cashInHand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <p className="text-[7px] font-bold text-amber-900 uppercase tracking-widest mt-0.5">Untaxed</p>
                                    </div>
                                </div>

                                <p className="text-[8px] text-zinc-800 font-bold text-center pt-2">Estimates only. Actual withholding varies by employer.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </section>

            {/* Action Bar */}
            <section className="flex gap-4">
                <Link href="/app/new" className="flex-1 group">
                    <div className="relative p-6 bg-primary rounded-[2rem] shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden">
                        <Plus className="w-6 h-6 text-white" />
                        <span className="font-black font-outfit text-white tracking-tight text-lg">New Entry</span>
                    </div>
                </Link>
                <Link href="/app/groups" className="flex-1 group">
                    <div className="relative p-6 bg-zinc-900/60 border border-white/10 rounded-[2rem] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                        <span className="font-black font-outfit text-white tracking-tight text-lg">Parties</span>
                    </div>
                </Link>
            </section>

            {/* Recent Sessions */}
            <section className="space-y-5">
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                        <h2 className="font-black font-outfit text-lg text-white tracking-tight uppercase">Recent Sessions</h2>
                    </div>
                    <Link href="/app/history" className="text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:text-primary transition-colors">History →</Link>
                </div>

                <div className="space-y-4">
                    {recentShifts.length > 0 ? (
                        recentShifts.map((shift: any) => {
                            const cash = parseFloat(shift.computed_data?.cashTips || 0)
                            const cc = parseFloat(shift.tips || 0)
                            const tipOut = parseFloat(shift.computed_data?.supportPool || 0)
                            const shiftNet = (cc + cash) - tipOut
                            const shiftTakeHome = shiftNet * 0.85

                            return (
                                <div key={shift.id} className="relative group">
                                    <Card
                                        onClick={() => setSelectedShiftId(shift.id)}
                                        className="p-0 overflow-hidden bg-zinc-900/40 border-white/5 rounded-[2.2rem] shadow-xl relative cursor-pointer active:scale-[0.98] transition-all hover:bg-zinc-900/60"
                                    >
                                        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-zinc-900/20">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-primary shadow-inner border border-white/5">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black font-outfit text-white leading-none mb-2 capitalize text-lg tracking-tighter">{shift.shift_type} Session</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{format(new Date(shift.date + 'T12:00:00'), 'MMM do')}</p>
                                                        <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                                                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                                                            {Math.floor(shift.hours)}h {Math.round((shift.hours % 1) * 60)}m
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black font-outfit text-2xl text-white tracking-tighter leading-none">${shiftTakeHome.toFixed(0)}</p>
                                                <p className="text-[8px] text-primary font-black uppercase tracking-widest mt-1 opacity-60">Net Profit</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/20 p-4 px-8 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                                            <div className="flex gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Gross</span>
                                                    <span className="text-xs font-black text-zinc-400 font-outfit">${(cc + cash).toFixed(0)}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-white/5 pl-6">
                                                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Tip Out</span>
                                                    <span className="text-xs font-black text-zinc-600 font-outfit">-${tipOut.toFixed(0)}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-white/5 pl-6 text-indigo-400/60">
                                                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Hourly</span>
                                                    <span className="text-xs font-black font-outfit">${shift.computed_data?.hourlyRate || '0.00'}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-900 group-hover:text-primary transition-colors" />
                                        </div>
                                    </Card>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteModalKey(shift.id); }}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hidden group-hover:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )
                        })
                    ) : (
                        <Card className="py-16 px-6 text-center bg-zinc-900/40 rounded-[3rem] border border-dashed border-white/10 space-y-6">
                            <div className="w-24 h-24 mx-auto bg-primary/5 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-inner">
                                <Wallet className="w-10 h-10 text-primary opacity-80" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black font-outfit tracking-tighter text-white">No Shifts Yet.</h3>
                                <p className="text-[10px] uppercase tracking-widest text-zinc-500 max-w-[200px] mx-auto leading-relaxed">Join a work party and log your first shift to unlock intelligence.</p>
                            </div>
                            <div className="pt-2">
                                <Link href="/app/groups" className="inline-block py-4 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 active:scale-95 transition-all">
                                    Join a Party
                                </Link>
                            </div>
                        </Card>
                    )}
                </div>
            </section>

            {/* SHIFT DETAILS MODAL */}
            <Modal isOpen={!!selectedShiftId} onClose={() => setSelectedShiftId(null)} title="Shift Intelligence">
                {selectedShift && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-primary">{format(new Date(selectedShift.date + 'T12:00:00'), 'EEEE, MMMM do')}</p>
                                <h2 className="text-3xl font-black font-outfit text-white tracking-tighter capitalize">{selectedShift.shift_type} Session</h2>
                            </div>
                            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                                <Calculator className="w-6 h-6 text-primary" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Total Sales</p>
                                <p className="text-2xl font-black font-outfit text-white">${parseFloat(selectedShift.net_sales).toLocaleString()}</p>
                            </div>
                            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Duration</p>
                                <p className="text-2xl font-black font-outfit text-white">{Math.floor(selectedShift.hours)}h {Math.round((selectedShift.hours % 1) * 60)}m</p>
                            </div>
                        </div>

                        <Card className="!p-8 bg-black border-white/5 rounded-[2rem] space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Calculation Breakdown</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-zinc-500">CC Tips</p>
                                <p className="text-xs font-black text-white">${parseFloat(selectedShift.tips || 0).toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-zinc-500">Cash Tips</p>
                                <p className="text-xs font-black text-emerald-400">${parseFloat(selectedShift.computed_data?.cashTips || 0).toFixed(2)}</p>
                            </div>
                            {selectedShift.computed_data?.wageEarnings > 0 && (
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-zinc-500">Base Wage (${selectedShift.computed_data?.hourlyWage}/hr)</p>
                                    <p className="text-xs font-black text-emerald-400">+${parseFloat(selectedShift.computed_data.wageEarnings).toFixed(2)}</p>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-zinc-500">Tip Out</p>
                                <p className="text-xs font-black text-red-500">-${parseFloat(selectedShift.computed_data?.supportPool || 0).toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <p className="text-xs font-black text-white uppercase tracking-tighter">Pre-Tax</p>
                                <p className="text-lg font-black text-white font-outfit">
                                    ${((parseFloat(selectedShift.tips || 0) + parseFloat(selectedShift.computed_data?.cashTips || 0) + parseFloat(selectedShift.computed_data?.wageEarnings || 0)) - parseFloat(selectedShift.computed_data?.supportPool || 0)).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-zinc-500 italic">Est. 15% Tax</p>
                                <p className="text-xs font-black text-indigo-400">
                                    -${(((parseFloat(selectedShift.tips || 0) + parseFloat(selectedShift.computed_data?.cashTips || 0) + parseFloat(selectedShift.computed_data?.wageEarnings || 0)) - parseFloat(selectedShift.computed_data?.supportPool || 0)) * 0.15).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                                <p className="text-sm font-black text-primary uppercase tracking-tighter">Take-Home</p>
                                <p className="text-2xl font-black text-primary font-outfit">
                                    ${(((parseFloat(selectedShift.tips || 0) + parseFloat(selectedShift.computed_data?.cashTips || 0) + parseFloat(selectedShift.computed_data?.wageEarnings || 0)) - parseFloat(selectedShift.computed_data?.supportPool || 0)) * 0.85).toFixed(2)}
                                </p>
                            </div>
                        </Card>

                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={() => setSelectedShiftId(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl">Close</Button>
                            <Button variant="danger" onClick={() => { setSelectedShiftId(null); setDeleteModalKey(selectedShift.id); }} className="px-6 py-4 rounded-xl">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* DELETE MODAL */}
            <Modal isOpen={!!deleteModalKey} onClose={() => setDeleteModalKey(null)} title="Purge Record?">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
                        <p className="text-xs text-zinc-400 font-bold leading-relaxed">This will permanently remove this shift from your history and paycheck estimate.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <Button variant="secondary" onClick={() => setDeleteModalKey(null)} className="py-4 rounded-xl text-xs uppercase tracking-widest">Keep It</Button>
                        <Button variant="danger" onClick={handleDeleteShift} disabled={isDeleting} className="py-4 rounded-xl text-xs uppercase tracking-widest">
                            {isDeleting ? "Deleting..." : "Purge"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
