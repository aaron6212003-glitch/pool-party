"use client"

import { useState, useEffect } from 'react'
import { Card, Button, Input, SectionTitle, GlassCard, Badge, Modal, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { History, Calendar, LayoutGrid, TrendingUp, ChevronRight, Clock, Trash2, AlertCircle, Info, Calculator, Wallet, ChevronDown } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, subMonths, isWithinInterval } from 'date-fns'

export default function HistoryPage() {
    const [loading, setLoading] = useState(true)
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
        const tipOut = parseFloat(curr.computed_data?.supportPool || 0)
        const cash = parseFloat(curr.computed_data?.cashTips || 0)
        const cc = parseFloat(curr.tips || 0)
        const shiftNet = (cc + cash) - tipOut

        return {
            sales: acc.sales + parseFloat(curr.net_sales || 0),
            tips: acc.tips + cc + cash,
            hours: acc.hours + parseFloat(curr.hours || 0),
            takehome: acc.takehome + (shiftNet * 0.85) // 15% Tax
        }
    }, { sales: 0, tips: 0, hours: 0, takehome: 0 })

    const selectedShift = entries.find(s => s.id === selectedShiftId)

    if (loading) {
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

            {/* Weekly Performance HUD */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-3 bg-secondary rounded-full"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Weekly Performance</p>
                </div>
                <Card className="grid grid-cols-2 gap-4 p-8 bg-zinc-900 border-white/5 rounded-[2.5rem] shadow-3xl text-center">
                    <div className="space-y-1 border-r border-white/5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Take-Home (Est.)</p>
                        <p className="text-3xl font-black font-outfit text-white tracking-tighter">${weeklyStats.takehome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Total Tips</p>
                        <p className="text-3xl font-black font-outfit text-white tracking-tighter">${weeklyStats.tips.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="col-span-2 pt-6 mt-4 border-t border-white/5 grid grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-700">Net Sales</p>
                            <p className="text-lg font-black font-outfit text-zinc-400">${weeklyStats.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-700">Total Hours</p>
                            <p className="text-lg font-black font-outfit text-zinc-400">{Math.floor(weeklyStats.hours)}h {Math.round((weeklyStats.hours % 1) * 60)}m</p>
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
                                            <p className="font-black text-white leading-none mb-2 capitalize tracking-tight text-lg">{shift.shift_type} Shift</p>
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

                        <Card className="!p-8 bg-black border-white/5 rounded-[2rem] space-y-6 text-white font-outfit">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Financial Breakdown</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-zinc-500">Gross Tips</p>
                                    <p className="text-xs font-black">${(parseFloat(selectedShift.tips) + parseFloat(selectedShift.computed_data?.cashTips || 0)).toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center text-red-500">
                                    <p className="text-xs font-bold opacity-80">Tip out Deduction</p>
                                    <p className="text-xs font-black">-${parseFloat(selectedShift.computed_data?.supportPool || 0).toFixed(2)}</p>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-black uppercase tracking-tighter">Pre-Tax Shift Net</p>
                                    <p className="text-lg font-black">${(parseFloat(selectedShift.tips) + parseFloat(selectedShift.computed_data?.cashTips || 0) - parseFloat(selectedShift.computed_data?.supportPool || 0)).toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center text-indigo-400">
                                    <p className="text-xs font-bold italic opacity-80">Est. 15% Taxes</p>
                                    <p className="text-xs font-black">-${((parseFloat(selectedShift.tips) + parseFloat(selectedShift.computed_data?.cashTips || 0) - parseFloat(selectedShift.computed_data?.supportPool || 0)) * 0.15).toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-primary/20 bg-primary/5 p-4 rounded-xl">
                                    <p className="text-sm font-black text-primary uppercase tracking-tighter">Post-Tax Takehome</p>
                                    <p className="text-2xl font-black text-primary">${((parseFloat(selectedShift.tips) + parseFloat(selectedShift.computed_data?.cashTips || 0) - parseFloat(selectedShift.computed_data?.supportPool || 0)) * 0.85).toFixed(2)}</p>
                                </div>
                            </div>
                        </Card>

                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={() => setSelectedShiftId(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl">Close Catalog</Button>
                        </div>
                    </div>
                )}
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
    )
}
