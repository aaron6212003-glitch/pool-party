"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, Badge } from '@/components/PercocoUI'
import { toast } from 'sonner'
import { Download, ChevronRight, DollarSign, Clock, TrendingUp, Sparkles, MinusCircle, Calendar, Info } from 'lucide-react'
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
            className="fixed inset-0 z-[100] bg-black/99 backdrop-blur-3xl flex flex-col items-center justify-start p-6 overflow-y-auto no-scrollbar"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
        >
            {/* The "Receipt" Card */}
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="w-full max-w-[380px] relative mb-12"
                id="shift-wrap-container"
            >
                {/* Background Textures */}
                <div className="absolute top-0 -left-20 w-80 h-80 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 -right-20 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                <Card className="!p-0 overflow-hidden bg-zinc-900 border-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.9)] rounded-[4rem] relative z-10">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-primary via-blue-700 to-indigo-950 p-12 text-center relative overflow-hidden">
                        {/* Dot Pattern Overlay */}
                        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '16px 16px' }} />
                        
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
                                className="w-24 h-24 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center mb-8 relative border-4 border-white group"
                            >
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5">Grade</span>
                                <span className="text-4xl font-black font-outfit text-primary tracking-tighter leading-none">{data.grade}</span>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/10 group-hover:bg-primary transition-colors">
                                    <Info className="w-4 h-4" />
                                </div>
                            </motion.button>
                            
                            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/40 mb-2 font-outfit">Shift Experience</h2>
                            <p className="text-5xl font-black text-white tracking-widest font-outfit">WRAPPED.</p>
                        </div>
                    </div>

                    {/* Content Section with Premium Styles */}
                    <div className="p-12 space-y-12 bg-zinc-900/50 backdrop-blur-sm">
                        {/* Earnings Section */}
                        <div className="text-center relative py-4">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/5 rounded-full" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-1">Total Pay Period Contribution</p>
                            <h3 className="text-[5.5rem] font-black font-outfit text-white tracking-tighter leading-none mb-4">
                                ${data.totalEarned.toFixed(0)}
                            </h3>
                            <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-400">Above Group Average tonight</span>
                            </div>
                        </div>

                        {/* Stats Grid - Premium Boxes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 text-center space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                                    <Clock className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 relative z-10">Adj. Rate</p>
                                <p className="text-3xl font-black font-outfit text-white tracking-tighter relative z-10">${data.tipsPerHour.toFixed(0)}<span className="text-xs text-zinc-600 ml-1">/hr</span></p>
                            </div>
                            <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 text-center space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                                    <DollarSign className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 relative z-10">Net Sales</p>
                                <p className="text-3xl font-black font-outfit text-white tracking-tighter relative z-10">${data.netSales.toFixed(0)}</p>
                            </div>
                        </div>

                        {/* Breakdown Section - Lines and Details */}
                        <div className="space-y-8 bg-black/40 rounded-[3rem] p-10 border border-white/5 relative shadow-inner">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-700">Financial Ledger</p>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                </div>
                            </div>
                            
                            <div className="space-y-5">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CC Tips</span>
                                    <span className="text-lg font-black text-white font-outfit tracking-tight">${data.ccTips.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center px-2">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cash Tips</span>
                                    <span className="text-lg font-black text-white font-outfit tracking-tight">${data.cashTips.toFixed(2)}</span>
                                </div>

                                <div className="h-px bg-white/5 w-full mx-auto" />

                                {data.tipOut > 0 && (
                                    <div className="flex justify-between items-center px-2 text-red-500">
                                        <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            <MinusCircle className="w-3.5 h-3.5 opacity-50" /> Support Pool Out
                                        </span>
                                        <span className="text-lg font-black font-outfit tracking-tight">-${data.tipOut.toFixed(2)}</span>
                                    </div>
                                )}

                                {data.basePay > 0 && (
                                    <div className="flex justify-between items-center px-2 text-emerald-500">
                                        <span className="text-xs font-bold uppercase tracking-widest">Pre-Tax Base Hourly</span>
                                        <span className="text-lg font-black font-outfit tracking-tight">+${data.basePay.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-white/10 flex justify-between items-center px-2">
                                <span className="text-[13px] font-black uppercase tracking-[0.3em] text-white">Net Deposit</span>
                                <span className="text-3xl font-black text-primary font-outfit drop-shadow-[0_0_15px_rgba(0,122,255,0.4)]">${data.totalEarned.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-8 py-6 bg-zinc-800/40 rounded-[2rem] border border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Service Verified</p>
                                    <p className="text-[11px] font-black text-zinc-300 uppercase tracking-[0.2em]">{format(data.date, 'MMMM do, yyyy')}</p>
                                </div>
                                <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase px-5 py-2.5 rounded-2xl">{data.shiftType}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Footer / Branding */}
                    <div className="px-12 py-14 bg-black border-t border-white/5 text-center flex flex-col items-center gap-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-6 relative z-10 grayscale opacity-40">
                             <div className="h-0.5 w-16 bg-zinc-800 flex-1" />
                             <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                                <span className="text-[11px] font-bold text-white uppercase tracking-[1em] font-outfit">POOL PARTY</span>
                                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                             </div>
                             <div className="h-0.5 w-16 bg-zinc-800 flex-1" />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-4">Verification Artifact #PK-{Math.floor(Math.random() * 90000) + 10000}</p>
                            <div className="w-full h-8 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center overflow-hidden opacity-20">
                                <div className="w-full h-full opacity-50" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 4px, white 4px, white 5px)`, backgroundSize: '10px 100%' }} />
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Actions Bar - Sticky-ish */}
            <div className="w-full max-w-[380px] space-y-4 pb-16">
                <Button 
                    className="w-full py-8 text-2xl rounded-[2.5rem] flex items-center justify-center gap-5 shadow-[0_20px_80px_rgba(0,122,255,0.4)] font-outfit font-black group overflow-hidden relative border-t-2 border-white/20"
                    onClick={() => {
                        toast.success("Ready for Photo Save!", {
                            description: "Screenshot the card for your camera roll. Native save coming in 1.2!"
                        })
                    }}
                >
                    <Download className="w-9 h-9 group-hover:scale-110 transition-transform" />
                    Save to Photos
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                </Button>
                <button 
                    onClick={onClose}
                    className="w-full py-6 text-[12px] font-black uppercase tracking-[0.6em] text-zinc-600 hover:text-white transition-all bg-zinc-950 border border-white/5 rounded-[2.5rem] active:scale-95 flex items-center justify-center gap-3"
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
                        className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
                        onClick={() => setShowCriteria(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="w-full max-w-sm"
                            onClick={e => e.stopPropagation()}
                        >
                            <Card className="!p-10 bg-zinc-900 border-white/10 rounded-[3.5rem] space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
                                
                                <div className="text-center space-y-3 relative z-10">
                                    <h3 className="text-3xl font-black font-outfit text-white tracking-widest uppercase">The Scaling.</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-8">Grades are calculated by Tip % vs Net Sales. Professional standard benchmarks.</p>
                                </div>
                                
                                <div className="space-y-3 relative z-10">
                                    {criteria.map((c) => (
                                        <div key={c.grade} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-3xl border border-white/5 group hover:bg-white/[0.05] transition-colors">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center font-black font-outfit text-2xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform" style={{ color: c.color }}>
                                                    {c.grade}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black text-white uppercase tracking-wider">{c.label}</p>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{c.pct} Tips</p>
                                                </div>
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-zinc-800" />
                                        </div>
                                    ))}
                                </div>

                                <Button className="w-full py-6 rounded-[2rem] font-black uppercase text-xs" onClick={() => setShowCriteria(false)}>
                                    Understood
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
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </motion.div>
    )
}
