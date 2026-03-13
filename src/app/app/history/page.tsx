"use client"

import { useState, useEffect } from 'react'
import { Card, Button, Input, SectionTitle, GlassCard, Badge, Modal, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'

import { toast } from 'sonner'
import { History, Calendar, LayoutGrid, TrendingUp, ChevronRight, Clock, Trash2, AlertCircle, Info, Calculator, Wallet, ChevronDown, Trophy } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, subMonths, isWithinInterval } from 'date-fns'
import { calculateShiftGrade } from '@/lib/calculations'
import AnimatedSplash from '@/components/AnimatedSplash'

export default function HistoryPage() {
    const [loading, setLoading] = useState(true)
    const [splashFinished, setSplashFinished] = useState(false)
    const [entries, setEntries] = useState<any[]>([])
    const [weeks, setWeeks] = useState<{ start: Date, end: Date, label: string }[]>([])
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

    const [deleteModalKey, setDeleteModalKey] = useState<string | null>(null)
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const supabase = createClient()

    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('shift_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })

        if (data) {
            setEntries(data)

            // Generate a list of weeks for the dropdown (last 3 months)
            const today = new Date()
            const intervalWeeks = eachWeekOfInterval({
                start: subMonths(today, 3),
                end: today
            }, { weekStartsOn: 1 }).reverse()

            const weekOptions = intervalWeeks.map(w => ({
                start: startOfWeek(w, { weekStartsOn: 1 }),
                end: endOfWeek(w, { weekStartsOn: 1 }),
                label: `Week of ${format(w, 'MMM do')}`
            }))

            setWeeks(weekOptions)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchHistory()
    }, [])

    const handleDeleteShift = async () => {
        if (!deleteModalKey) return
        setIsDeleting(true)
        try {
            const { error } = await supabase.from('shift_entries').delete().eq('id', deleteModalKey)
            if (error) throw error
            toast.success("Shift records purged.")
            setDeleteModalKey(null)
            fetchHistory()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsDeleting(false)
        }
    }

    const currentWeek = weeks[selectedWeekIndex]
    const filteredEntries = entries.filter(e => {
        if (!currentWeek) return false
        const d = new Date(e.date + 'T12:00:00')
        return isWithinInterval(d, { start: currentWeek.start, end: currentWeek.end })
    })

    // Weekly Stats Logic
    const weeklyStats = filteredEntries.reduce((acc, curr) => {
        const ccTips = parseFloat(curr.tips || 0)
        const cashTips = parseFloat(curr.computed_data?.cashTips || 0)
        const wageEarnings = parseFloat(curr.computed_data?.wageEarnings || 0)
        const supportDeduction = parseFloat(curr.computed_data?.supportPool || 0)

        const preTaxCheck = ccTips + wageEarnings - supportDeduction
        const estTaxes = preTaxCheck * 0.15
        const postTaxCheck = preTaxCheck - estTaxes
        const totalTakehome = cashTips + postTaxCheck

        return {
            sales: acc.sales + parseFloat(curr.net_sales || 0),
            hours: acc.hours + parseFloat(curr.hours || 0),
            ccTips: acc.ccTips + ccTips,
            cashTips: acc.cashTips + cashTips,
            wageEarnings: acc.wageEarnings + wageEarnings,
            supportDeduction: acc.supportDeduction + supportDeduction,
            preTaxCheck: acc.preTaxCheck + preTaxCheck,
            estTaxes: acc.estTaxes + estTaxes,
            postTaxCheck: acc.postTaxCheck + postTaxCheck,
            totalTakehome: acc.totalTakehome + totalTakehome,
        }
    }, {
        sales: 0,
        hours: 0,
        ccTips: 0,
        cashTips: 0,
        wageEarnings: 0,
        supportDeduction: 0,
        preTaxCheck: 0,
        estTaxes: 0,
        postTaxCheck: 0,
        totalTakehome: 0,
    })

    const selectedShift = entries.find(s => s.id === selectedShiftId)

    if (loading) {
        return <AnimatedSplash isComplete={false} />
    }

    return (
        <>
        {!splashFinished && (
            <AnimatedSplash isComplete={!loading} onComplete={() => setSplashFinished(true)} />
        )}
        <div className="p-6 space-y-8 animate-in pb-32 bg-black min-h-screen">
            <header className="flex justify-between items-start mt-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Intelligence Catalog</p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter">History.</h1>
                </div>
                <div className="w-12 h-12 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center text-primary border border-white/5 shadow-xl">
                    <History className="w-6 h-6" />
                </div>
            </header>

            {/* Week Selector Dropdown */}
            <section className="relative group">
                <div className="absolute -inset-1 bg-primary/20 blur opacity-10 group-hover:opacity-30 transition-opacity rounded-[1.5rem]"></div>
                <div className="relative p-5 bg-zinc-900 border border-white/5 rounded-[1.5rem] shadow-xl flex items-center justify-between">
                    <div className="flex gap-4 items-center">
                        <Calendar className="w-5 h-5 text-zinc-600" />
                        <select
                            value={selectedWeekIndex}
                            onChange={(e) => setSelectedWeekIndex(parseInt(e.target.value))}
                            className="bg-transparent text-white font-black font-outfit text-lg outline-none cursor-pointer appearance-none pr-8"
                        >
                            {weeks.map((w, i) => (
                                <option key={i} value={i} className="bg-zinc-900">{w.label}</option>
                            ))}
                        </select>
                    </div>
                    <ChevronDown className="w-5 h-5 text-zinc-700 pointer-events-none absolute right-5" />
                </div>
            </section>

            {/* Personal Bests (All-Time) */}
            {(() => {
                const bests = entries.reduce((acc, curr) => {
                    const sales = parseFloat(curr.net_sales || 0)
                    const tips = parseFloat(curr.tips || 0) + parseFloat(curr.computed_data?.cashTips || 0) + parseFloat(curr.computed_data?.wageEarnings || 0)
                    if (sales > acc.sales.amount) acc.sales = { amount: sales, date: curr.date }
                    if (tips > acc.tips.amount) acc.tips = { amount: tips, date: curr.date }
                    return acc
                }, { sales: { amount: 0, date: '' }, tips: { amount: 0, date: '' } })

                if (bests.sales.amount === 0) return null

                return (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="w-1 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Hall of Fame</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="!p-5 bg-zinc-900 border-amber-500/20 shadow-[0_8px_30px_rgba(245,158,11,0.05)] rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all"></div>
                                <div className="relative z-10 space-y-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Max Net Sales</p>
                                        <p className="text-2xl font-black font-outfit text-white tracking-tighter">${bests.sales.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">
                                            {format(new Date(bests.sales.date + 'T12:00:00'), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="!p-5 bg-zinc-900 border-emerald-500/20 shadow-[0_8px_30px_rgba(16,185,129,0.05)] rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all"></div>
                                <div className="relative z-10 space-y-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Max Tips + Wage</p>
                                        <p className="text-2xl font-black font-outfit text-white tracking-tighter">${bests.tips.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">
                                            {format(new Date(bests.tips.date + 'T12:00:00'), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </section>
                )
            })()}

            {/* Weekly Paycheck Breakdown */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-3 bg-secondary rounded-full"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Weekly Paycheck Breakdown</p>
                </div>
                <Card className="!p-8 bg-black border-white/5 rounded-[2rem] space-y-6 text-white font-outfit overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <Info className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Estimated Earnings</span>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-zinc-500">Credit Card Tips</p>
                            <p className="text-xs font-black">${weeklyStats.ccTips.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-zinc-500">Wage Earnings</p>
                            <p className="text-xs font-black">${weeklyStats.wageEarnings.toFixed(2)}</p>
                        </div>

                        <div className="flex justify-between items-center text-red-500">
                            <p className="text-xs font-bold opacity-80">Support Pool Deduction</p>
                            <p className="text-xs font-black">-${weeklyStats.supportDeduction.toFixed(2)}</p>
                        </div>

                        <div className="h-px bg-white/5" />

                        <div className="flex justify-between items-center">
                            <p className="text-xs font-black uppercase tracking-tighter text-white">Pre-Tax Check</p>
                            <p className="text-sm font-black">${weeklyStats.preTaxCheck.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center text-indigo-400">
                            <p className="text-xs font-bold italic opacity-80">Est. 15% Taxes</p>
                            <p className="text-xs font-black">-${weeklyStats.estTaxes.toFixed(2)}</p>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-indigo-500/20 bg-indigo-500/5 p-4 rounded-xl shadow-[inset_0_1px_0_0_rgba(99,102,241,0.1)] mt-4">
                            <div className="space-y-0.5">
                                <p className="text-sm font-black text-indigo-400 uppercase tracking-tighter">Expected Deposit</p>
                                <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">Excludes Cash</p>
                            </div>
                            <p className="text-3xl font-black text-indigo-400 tracking-tighter">${weeklyStats.postTaxCheck.toFixed(2)}</p>
                        </div>

                        <div className="h-px border-t border-dashed border-white/10 mt-4" />

                        <div className="flex justify-between items-center mt-4">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Takehome</p>
                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Check + Cash</p>
                            </div>
                            <p className="text-[15px] font-black font-outfit text-emerald-400">${weeklyStats.totalTakehome.toFixed(2)}</p>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Cash in Hand</p>
                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Kept separate, untaxed</p>
                            </div>
                            <p className="text-[15px] font-black font-outfit text-amber-400">${weeklyStats.cashTips.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Entries Feed */}
            <section className="space-y-5">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-lg text-white tracking-tight uppercase tracking-widest opacity-80">Shift Catalog</h2>
                    <Badge className="bg-white/5 text-zinc-500 border-none font-black text-[8px] uppercase tracking-[0.2em]">{filteredEntries.length} Sessions</Badge>
                </div>

                <div className="space-y-4">
                    {filteredEntries.length > 0 ? (
                        filteredEntries.map((shift) => (
                            <div key={shift.id} className="relative group">
                                <Card
                                    onClick={() => setSelectedShiftId(shift.id)}
                                    className="flex items-center justify-between p-6 bg-zinc-900/40 border-white/5 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-zinc-900/60 shadow-xl overflow-hidden cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 relative z-10 font-outfit">
                                        <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center text-primary border border-white/5 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <p className="font-black text-white leading-none capitalize tracking-tight text-lg">{shift.shift_type} Shift</p>
                                                {(() => {
                                                    const grade = calculateShiftGrade(
                                                        parseFloat(shift.net_sales || 0),
                                                        parseFloat(shift.tips || 0) + parseFloat(shift.computed_data?.cashTips || 0)
                                                    )
                                                    if (grade.grade === '-') return null
                                                    return (
                                                        <span className={cn("text-[10px] font-black font-outfit px-1.5 py-0.5 rounded-md bg-black border border-white/5 shadow-inner", grade.color)}>
                                                            {grade.grade}
                                                        </span>
                                                    )
                                                })()}
                                            </div>
                                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                                {format(new Date(shift.date + 'T12:00:00'), 'EEE, MMM d')} • {Math.floor(shift.hours)}h {Math.round((shift.hours % 1) * 60)}m
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 relative z-10 shrink-0">
                                        <div className="text-right">
                                            <p className="font-outfit font-black leading-none text-2xl text-white tracking-tighter">${parseFloat(shift.net_sales).toLocaleString()}</p>
                                            <div className="flex items-center justify-end gap-1.5 mt-1.5">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", shift.group_id ? "bg-primary" : "bg-zinc-800")}></div>
                                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">
                                                    {shift.group_id ? 'Team' : 'Solo'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-800" />
                                    </div>
                                </Card>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteModalKey(shift.id); }}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hidden group-hover:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 text-center bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-white/5">
                            <History className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                            <h3 className="font-black font-outfit text-xl text-white">No Week Data</h3>
                            <p className="text-xs text-zinc-600 mt-1 uppercase font-black tracking-widest">Awaiting records for this period.</p>
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
                {selectedShift && (() => {
                    const ccTips = parseFloat(selectedShift.tips || 0)
                    const cashTips = parseFloat(selectedShift.computed_data?.cashTips || 0)
                    const wageEarnings = parseFloat(selectedShift.computed_data?.wageEarnings || 0)
                    const supportDeduction = parseFloat(selectedShift.computed_data?.supportPool || 0)

                    const grossEarned = ccTips + cashTips + wageEarnings

                    // Breakdown
                    const cashInHand = cashTips
                    const preTaxCheck = ccTips + wageEarnings - supportDeduction
                    const estTaxes = preTaxCheck * 0.15
                    const estCheckAdd = preTaxCheck - estTaxes
                    const totalTakehome = cashInHand + estCheckAdd

                    return (
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

                            <Card className="!p-8 bg-black border-white/5 rounded-[2rem] space-y-6 text-white font-outfit overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                <div className="flex items-center gap-2 mb-2 relative z-10">
                                    <Info className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Financial Breakdown</span>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-bold text-zinc-500">Credit Card Tips</p>
                                        <p className="text-xs font-black">${ccTips.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-bold text-zinc-500">Wage Earnings</p>
                                        <p className="text-xs font-black">${wageEarnings.toFixed(2)}</p>
                                    </div>

                                    <div className="flex justify-between items-center text-red-500">
                                        <p className="text-xs font-bold opacity-80">Support Pool Deduction</p>
                                        <p className="text-xs font-black">-${supportDeduction.toFixed(2)}</p>
                                    </div>

                                    <div className="h-px bg-white/5" />

                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-black uppercase tracking-tighter text-white">Pre-Tax Check</p>
                                        <p className="text-sm font-black">${preTaxCheck.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-indigo-400">
                                        <p className="text-xs font-bold italic opacity-80">Est. 15% Taxes</p>
                                        <p className="text-xs font-black">-${estTaxes.toFixed(2)}</p>
                                    </div>

                                    <div className="pt-3 pb-1 flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Est. Paycheck Add</p>
                                        </div>
                                        <p className="text-[15px] font-black font-outfit text-white">${estCheckAdd.toFixed(2)}</p>
                                    </div>

                                    <div className="h-px border-t border-dashed border-white/10" />

                                    <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Cash in Hand</p>
                                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Kept separate, untaxed</p>
                                        </div>
                                        <p className="text-[15px] font-black font-outfit text-amber-400">${cashInHand.toFixed(2)}</p>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl shadow-[inset_0_1px_0_0_rgba(16,185,129,0.1)] mt-4">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter">Total Takehome</p>
                                            <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest">Check + Cash</p>
                                        </div>
                                        <p className="text-3xl font-black text-emerald-400 tracking-tighter">${totalTakehome.toFixed(2)}</p>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex gap-4">
                                <Button variant="secondary" onClick={() => setSelectedShiftId(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl">Close Catalog</Button>
                            </div>
                        </div>
                    )
                })()}
            </Modal>

            {/* CONFIRMATION MODAL */}
            <Modal
                isOpen={!!deleteModalKey}
                onClose={() => setDeleteModalKey(null)}
                title="Purge Entry?"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
                        <p className="text-xs text-zinc-400 font-bold leading-relaxed">Warning: This action is irreversible. This record will be wiped from your intelligence history.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <Button variant="secondary" onClick={() => setDeleteModalKey(null)} className="py-4 rounded-xl text-xs uppercase tracking-widest">Cancel</Button>
                        <Button variant="danger" onClick={handleDeleteShift} disabled={isDeleting} className="py-4 rounded-xl text-xs uppercase tracking-widest">
                            {isDeleting ? "Purging..." : "Confirm Purge"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
        </>
    )
}
