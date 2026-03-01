"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, SectionTitle, Badge, Button, Modal, cn, Input } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Plus, LayoutGrid, Calendar, ChevronRight, Clock, DollarSign, Wallet, ShieldAlert, PieChart, Trash2, AlertCircle, Info, Calculator, Banknote, Timer } from 'lucide-react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { toast } from 'sonner'

export default function Dashboard() {
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState({
        netSales: 0,
        tipOutPaid: 0,
        hours: 0,
        grossTips: 0,
        hourlyRate: 2.13
    })
    const [recentShifts, setRecentShifts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteModalKey, setDeleteModalKey] = useState<string | null>(null)
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const supabase = createClient()

    const fetchDashboardData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUser(user)

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
            const totals = weeklyEntries.reduce((acc, curr) => {
                const tipOut = parseFloat(curr.computed_data?.supportPool || 0)
                const cash = parseFloat(curr.computed_data?.cashTips || 0)
                return {
                    netSales: acc.netSales + parseFloat(curr.net_sales || 0),
                    tipOutPaid: acc.tipOutPaid + tipOut,
                    hours: acc.hours + parseFloat(curr.hours || 0),
                    grossTips: acc.grossTips + parseFloat(curr.tips || 0) + cash
                }
            }, { netSales: 0, tipOutPaid: 0, hours: 0, grossTips: 0 })
            setStats(prev => ({ ...prev, ...totals }))
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

    // FINANCIAL CALCULATIONS (15% Tax)
    const basePay = stats.hours * stats.hourlyRate
    const grossTakeHome = (stats.grossTips - stats.tipOutPaid) + basePay
    const taxRate = 0.15
    const estimatedTax = grossTakeHome * taxRate
    const takeHomePay = grossTakeHome - estimatedTax

    const selectedShift = recentShifts.find(s => s.id === selectedShiftId)

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh] bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-8 animate-in pb-40 bg-black min-h-screen">
            <header className="flex justify-between items-center mt-4 px-1">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary opacity-70">Intelligence OS</p>
                    <h1 className="text-3xl font-black font-outfit text-white tracking-tighter capitalize">G'day, {firstName}</h1>
                </div>
                <Link href="/app/settings" className="relative group">
                    <div className="absolute -inset-1 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-11 h-11 rounded-full bg-zinc-900 border border-white/10 overflow-hidden ring-2 ring-white/5 relative z-10 shadow-xl">
                        <img src={user?.user_metadata?.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="Avatar" className="w-full h-full object-cover" />
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
                    <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Hours Logged</p>
                    <p className="text-lg font-black font-outfit text-white leading-none">
                        {Math.floor(stats.hours)}h {Math.round((stats.hours % 1) * 60)}m
                    </p>
                </div>
            </section>

            {/* PAYCHECK ESTIMATOR */}
            <section className="space-y-4">
                <div className="relative group">
                    <div className="absolute -inset-1 rounded-[2.5rem] blur-3xl bg-primary/20 opacity-30"></div>
                    <Card className="relative !p-10 bg-zinc-900 border-white/10 rounded-[2.5rem] shadow-3xl overflow-hidden border-t-primary/20">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <PieChart className="w-48 h-48" />
                        </div>

                        <div className="space-y-2 relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <Wallet className="w-3 h-3 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Take-Home Estimate</span>
                            </div>
                            <h2 className="text-7xl font-black font-outfit text-white tracking-tighter leading-none">${takeHomePay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
                            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest pt-2">Calculated after 15% Taxes & Tip out</p>
                        </div>
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
                    <Link href="/app/history" className="text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:text-primary transition-colors">History Catalog →</Link>
                </div>

                <div className="space-y-4">
                    {recentShifts.length > 0 ? (
                        recentShifts.map((shift) => {
                            const cash = parseFloat(shift.computed_data?.cashTips || 0)
                            const cc = parseFloat(shift.tips || 0)
                            const tipOut = parseFloat(shift.computed_data?.supportPool || 0)
                            const shiftNet = (cc + cash) - tipOut
                            const shiftTax = shiftNet * 0.15
                            const shiftTakeHome = shiftNet - shiftTax

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
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-black font-outfit text-2xl text-white tracking-tighter leading-none">${shiftTakeHome.toFixed(0)}</p>
                                                    <p className="text-[8px] text-primary font-black uppercase tracking-widest mt-1 opacity-60">Net Profit</p>
                                                </div>
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
                        <div className="py-20 text-center bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-white/5">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Awaiting Log Data</p>
                        </div>
                    )}
                </div>
            </section>

            {/* SHIFT DETAILS MODAL */}
            <Modal
                isOpen={!!selectedShiftId}
                onClose={() => setSelectedShiftId(null)}
                title="Shift Intelligence"
            >
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

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Total Sales</p>
                                <p className="text-2xl font-black font-outfit text-white font-outfit">${parseFloat(selectedShift.net_sales).toLocaleString()}</p>
                            </div>
                            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Time Duration</p>
                                <p className="text-2xl font-black font-outfit text-white font-outfit">{Math.floor(selectedShift.hours)}h {Math.round((selectedShift.hours % 1) * 60)}m</p>
                            </div>
                        </div>

                        {/* Calculation Steps */}
                        <Card className="!p-8 bg-black border-white/5 rounded-[2rem] space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Calculation Logic</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-zinc-500">Gross Tips (CC + Cash)</p>
                                    <p className="text-xs font-black text-white">${(parseFloat(selectedShift.tips) + parseFloat(selectedShift.computed_data?.cashTips || 0)).toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-zinc-500">Tip out ({((parseFloat(selectedShift.computed_data?.supportPool) / parseFloat(selectedShift.net_sales)) * 100).toFixed(1)}%)</p>
                                    <p className="text-xs font-black text-red-500">-${parseFloat(selectedShift.computed_data?.supportPool || 0).toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                    <p className="text-xs font-black text-white uppercase tracking-tighter">Pre-Tax Earnings</p>
                                    <p className="text-lg font-black text-white font-outfit">${(parseFloat(selectedShift.tips) + parseFloat(selectedShift.computed_data?.cashTips || 0) - parseFloat(selectedShift.computed_data?.supportPool || 0)).toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-zinc-500 italic">Est. 15% Tax Deduction</p>
                                    <p className="text-xs font-black text-indigo-400">-${((parseFloat(selectedShift.tips) + parseFloat(selectedShift.computed_data?.cashTips || 0) - parseFloat(selectedShift.computed_data?.supportPool || 0)) * 0.15).toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-primary/20 bg-primary/5 p-4 rounded-xl">
                                    <p className="text-sm font-black text-primary uppercase tracking-tighter">Post-Tax Takehome</p>
                                    <p className="text-2xl font-black text-primary font-outfit">${((parseFloat(selectedShift.tips) + parseFloat(selectedShift.computed_data?.cashTips || 0) - parseFloat(selectedShift.computed_data?.supportPool || 0)) * 0.85).toFixed(2)}</p>
                                </div>
                            </div>
                        </Card>

                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={() => setSelectedShiftId(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl">Close Details</Button>
                            <Button variant="danger" onClick={() => { setSelectedShiftId(null); setDeleteModalKey(selectedShift.id); }} className="px-6 py-4 rounded-xl">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal
                isOpen={!!deleteModalKey}
                onClose={() => setDeleteModalKey(null)}
                title="Purge Record?"
            >
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
