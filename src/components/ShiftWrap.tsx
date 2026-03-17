"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, Badge } from '@/components/PercocoUI'
import { toast } from 'sonner'
import { Download, ChevronRight, DollarSign, Clock, TrendingUp, Sparkles, MinusCircle, Calendar, Info, Wallet, ReceiptText, Percent } from 'lucide-react'
import { format } from 'date-fns'

interface ShiftWrapProps {
    data: {
        totalEarned: number;
        tipsPerHour: number;
        netSales: number;
        hours: number;
        ccTips: number;
        cashTips: number;
        tipOut: number;
        basePay: number;
        grade: string;
        gradeColor: string;
        date: Date;
        shiftType: string;
        isPR?: boolean;
    };
    onClose: () => void;
}

export default function ShiftWrap({ data, onClose }: ShiftWrapProps) {
    const [showCriteria, setShowCriteria] = useState(false)
    
    // Consistent calculations as per dashboard/check breakdown
    const preTaxCheck = (data.ccTips + data.basePay) - data.tipOut
    const estimatedTax = Math.max(0, preTaxCheck * 0.15)
    const digitalDeposit = Math.max(0, preTaxCheck - estimatedTax)
    const cashInHand = data.cashTips
    const grandTotal = digitalDeposit + cashInHand

    // Grade definitions for the info modal
    const criteria = [
        { pct: '25%+', grade: 'A+', color: '#10B981', label: 'Elite Tier' },
        { pct: '22%+', grade: 'A', color: '#10B981', label: 'Top Tier' },
        { pct: '20%+', grade: 'A-', color: '#10B981', label: 'High Standard' },
        { pct: '18%+', grade: 'B+', color: '#A3E635', label: 'Great Night' },
        { pct: '16%+', grade: 'B', color: '#FACC15', label: 'Above Average' },
        { pct: '14%+', grade: 'C+', color: '#F59E0B', label: 'Industry Avg' },
        { pct: '10%+', grade: 'D', color: '#F87171', label: 'Tough Shift' },
        { pct: '< 10%', grade: 'F', color: '#EF4444', label: 'Struggled' },
    ]

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/99 backdrop-blur-3xl flex flex-col items-center justify-start p-6 overflow-x-hidden overflow-y-auto pt-safe pb-20 no-scrollbar selection:bg-primary/30"
        >
            {/* The "Receipt" Card */}
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="w-full max-w-[380px] relative mb-12 mt-4 flex-shrink-0"
            >
                {/* Background Textures - Absolute hidden overflow to prevent side scroll */}
                <div className="absolute top-0 -left-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-40 -right-10 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
                
                <Card className="!p-0 overflow-hidden bg-zinc-900 border-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.9)] rounded-[4rem] relative z-10">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-primary via-blue-700 to-indigo-950 p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '16px 16px' }} />
                        
                        <motion.div 
                            animate={{ rotate: [5, -5, 5], scale: [1, 1.05, 1] }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute inset-x-0 -top-20 opacity-10 flex items-center justify-center pointer-events-none"
                        >
                            <Sparkles className="w-[500px] h-[500px] text-white" />
                        </motion.div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            {/* Grade Circle - Integrated and Clickable */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowCriteria(true)}
                                className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center mb-8 relative border-4 border-white transition-transform overflow-visible"
                            >
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5">Grade</span>
                                <span className="text-4xl font-black font-outfit text-primary leading-none">{data.grade}</span>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                                    <Info className="w-4 h-4" />
                                </div>
                            </motion.button>
                            
                            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/40 mb-2 font-outfit">Shift Session</h2>
                            <p className="text-5xl font-black text-white tracking-widest font-outfit">WRAPPED.</p>
                        </div>
                    </div>

                    {/* Content Section - Matching Check Breakdown Stats */}
                    <div className="p-12 space-y-12 bg-zinc-900/50 backdrop-blur-sm">
                        
                        {/* 1. Takehome Summary (digitalDeposit + cash) */}
                        <div className="text-center relative py-4">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/5 rounded-full" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-1">Estimated Net Profit</p>
                            <h3 className="text-[5.5rem] font-black font-outfit text-white tracking-tighter leading-none mb-4">
                                ${Math.floor(grandTotal).toLocaleString()}
                            </h3>
                            <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
                                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-400">Locked to your digital wallet</span>
                            </div>
                        </div>

                        {/* 2. Primary KPI Boxes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 text-center space-y-2 relative overflow-hidden group">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Adj. Hourly</p>
                                <p className="text-3xl font-black font-outfit text-white tracking-tighter">${data.tipsPerHour.toFixed(0)}<span className="text-xs text-zinc-600 ml-1">/hr</span></p>
                            </div>
                            <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 text-center space-y-2 relative overflow-hidden group">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Total Sales</p>
                                <p className="text-3xl font-black font-outfit text-white tracking-tighter">${data.netSales.toFixed(0)}</p>
                            </div>
                        </div>

                        {/* 3. The "Check Breakdown" Style Ledger */}
                        <div className="bg-black/40 rounded-[3rem] border border-white/5 overflow-hidden shadow-inner">
                            <div className="p-10 space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-2">
                                        <ReceiptText className="w-3 h-3" /> Check Ledger
                                    </p>
                                    <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Gross CC Tips</span>
                                        <span className="text-lg font-black text-white font-outfit">+${data.ccTips.toFixed(2)}</span>
                                    </div>

                                    {data.basePay > 0 && (
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Base Hourly Pay</span>
                                            <span className="text-lg font-black text-emerald-400 font-outfit">+${data.basePay.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center px-1 text-red-500">
                                        <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <MinusCircle className="w-3.5 h-3.5 opacity-40" /> Tip Out Loss
                                        </span>
                                        <span className="text-lg font-black font-outfit">-${data.tipOut.toFixed(2)}</span>
                                    </div>

                                    <div className="h-px bg-white/5 w-full my-2" />

                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Pre-Tax Check</span>
                                        <span className="text-lg font-black text-white font-outfit">${preTaxCheck.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center px-1 text-indigo-400">
                                        <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <Percent className="w-3.5 h-3.5 opacity-40" /> Est. 15% Tax
                                        </span>
                                        <span className="text-base font-black font-outfit">-${estimatedTax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Paycheck Result */}
                            <div className="bg-primary/10 p-10 border-t border-white/5 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Expected Deposit</p>
                                        <p className="text-[8px] font-bold text-primary/50 uppercase tracking-widest">Check Only</p>
                                    </div>
                                    <p className="text-3xl font-black text-primary font-outfit">${digitalDeposit.toFixed(2)}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Cash In Hand</p>
                                        <p className="text-xl font-black text-white font-outfit">${cashInHand.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Total Night</p>
                                        <p className="text-xl font-black text-emerald-400 font-outfit">${grandTotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-8 py-6 bg-zinc-800/40 rounded-[2.5rem] border border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Artifact Trace</p>
                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em]">{format(data.date, 'MMMM do, yyyy')}</p>
                                </div>
                                <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase px-5 py-2.5 rounded-2xl">{data.shiftType}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Branding Footer */}
                    <div className="px-12 py-16 bg-black/60 border-t border-white/5 text-center flex flex-col items-center gap-6 relative overflow-hidden">
                        <div className="flex items-center gap-6 relative z-10 grayscale opacity-20">
                             <div className="h-px w-20 bg-zinc-800" />
                             <span className="text-[11px] font-bold text-white uppercase tracking-[1em] font-outfit">POOL PARTY</span>
                             <div className="h-px w-20 bg-zinc-800" />
                        </div>
                        <p className="text-[7px] font-black text-zinc-800 uppercase tracking-[0.5em] relative z-10 opacity-40">INTELLIGENCE REPORT v1.1.2</p>
                    </div>
                </Card>
            </motion.div>

            {/* Actions Bar */}
            <div className="w-full max-w-[380px] space-y-4 pb-16 flex-shrink-0">
                <Button 
                    className="w-full py-8 text-2xl rounded-[3rem] flex items-center justify-center gap-5 shadow-[0_30px_100px_rgba(0,122,255,0.4)] font-outfit font-black group overflow-hidden relative border-t-2 border-white/20"
                    onClick={() => {
                        toast.success("Ready for export!", {
                            description: "Screenshot this record for your records."
                        })
                    }}
                >
                    <Download className="w-9 h-9" />
                    Save to Photos
                </Button>
                <button 
                    onClick={onClose}
                    className="w-full py-6 text-[12px] font-black uppercase tracking-[0.6em] text-zinc-600 hover:text-white transition-all bg-zinc-950 border border-white/5 rounded-[3rem] active:scale-95 flex items-center justify-center gap-3"
                >
                    Return to Feed <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Grade Criteria Modal */}
            <AnimatePresence>
                {showCriteria && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 overflow-hidden touch-none"
                        onClick={() => setShowCriteria(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar"
                            onClick={e => e.stopPropagation()}
                        >
                            <Card className="!p-10 bg-zinc-900 border-white/10 rounded-[4rem] space-y-10 shadow-[0_50px_150px_rgba(0,0,0,1)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
                                
                                <div className="text-center space-y-3 relative z-10">
                                    <h3 className="text-3xl font-black font-outfit text-white tracking-widest uppercase">The Scaling.</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-6">Calculated by Net Tip % vs Total Sales. Market performance benchmarks.</p>
                                </div>
                                
                                <div className="space-y-2 relative z-10">
                                    {criteria.map((c) => (
                                        <div key={c.grade} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-3xl border border-white/10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center font-black font-outfit text-2xl shadow-inner border border-white/5" style={{ color: c.color }}>
                                                    {c.grade}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black text-white uppercase tracking-wider">{c.label}</p>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{c.pct} Yield</p>
                                                </div>
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-zinc-900" />
                                        </div>
                                    ))}
                                </div>

                                <Button className="w-full py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest" onClick={() => setShowCriteria(false)}>
                                    Dismiss Record
                                </Button>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            `}</style>
        </motion.div>
    )
}
