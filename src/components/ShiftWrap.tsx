"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, Badge, cn } from '@/components/PercocoUI'
import { toast } from 'sonner'
import { Download, ChevronRight, DollarSign, Clock, TrendingUp, Sparkles, MinusCircle, Calendar, Info, Wallet, ReceiptText, Percent, Zap, Crown, Ghost, Palmtree, Scan, Shrink, Maximize2, Landmark, Coins } from 'lucide-react'
import { format } from 'date-fns'

export default function ShiftWrap({ data, onClose }: { data: any, onClose: () => void }) {
    const [showCriteria, setShowCriteria] = useState(false)
    
    // Consistent calculations
    const preTaxCheck = (data.ccTips + data.basePay) - data.tipOut
    const estimatedTax = Math.max(0, preTaxCheck * 0.15)
    // Formula: CC tips + hourly - taxes - tip out
    const digitalDeposit = Math.max(0, preTaxCheck - estimatedTax)
    const cashInHand = data.cashTips
    const grandTotal = digitalDeposit + cashInHand

    const criteria = [
        { pct: '25%+', grade: 'A+', color: '#10B981', label: 'Elite Tier' },
        { pct: '22%+', grade: 'A', color: '#10B981', label: 'Top Tier' },
        { pct: '20%+', grade: 'A-', color: '#10B981', label: 'High Standard' },
        { pct: '18%+', grade: 'B+', color: '#A3E635', label: 'Great Night' },
        { pct: '16%+', grade: 'B', color: '#FACC15', label: 'Above Average' },
        { pct: '14%+', grade: 'C+', color: '#F59E0B', label: 'Industry Avg' },
        { pct: '12%+', grade: 'C', color: '#F97316', label: 'Fair Shift' },
        { pct: '10%+', grade: 'D', color: '#F87171', label: 'Tough Shift' },
        { pct: '< 10%', grade: 'F', color: '#EF4444', label: 'Struggled' },
    ]

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] backdrop-blur-3xl overflow-y-auto pt-safe pb-10 no-scrollbar touch-pan-y flex flex-col items-center bg-black/98"
        >
            <div className="w-full max-w-[400px] flex flex-col items-center p-5">
                
                {/* The "Receipt" Card */}
                <motion.div
                    initial={{ scale: 0.9, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full relative mb-8 mt-6 flex-shrink-0"
                >
                    <Card className="!p-0 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-[3rem] relative z-10 border-white/5 bg-[#030712]">
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-primary/80 via-primary to-slate-950 p-10 text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '16px 16px' }} />
                            
                            <motion.div 
                                animate={{ rotate: [5, -5, 5], opacity: [0.1, 0.15, 0.1] }}
                                transition={{ duration: 10, repeat: Infinity }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <Sparkles className="w-[400px] h-[400px] text-white" />
                            </motion.div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowCriteria(true)}
                                    className="w-22 h-22 rounded-[2.2rem] shadow-2xl flex flex-col items-center justify-center mb-10 relative border-4 p-4 bg-white border-white"
                                >
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5 font-outfit">Rating</span>
                                    <span className="text-5xl font-black leading-none text-primary font-outfit">{data.grade}</span>
                                    <div className="absolute -top-3 -right-3 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                                        <Info className="w-4 h-4" />
                                    </div>
                                </motion.button>
                                
                                <h2 className="text-[10px] font-black uppercase tracking-[0.6em] mb-2 opacity-60 text-white font-outfit">Session Trace</h2>
                                <p className="text-5xl font-black tracking-tight leading-none text-white font-outfit">WRAPPED.</p>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-10 space-y-12 relative bg-[#09090b]/40">
                            
                            {/* Main Hero Stat */}
                            <div className="text-center relative py-4 space-y-4">
                                <div className="w-14 h-1 px-4 mx-auto rounded-full mb-6 bg-white/10" />
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-1 opacity-60 text-zinc-400">Total Net Takehome</p>
                                <div className="inline-flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-black opacity-30 tracking-none mr-1 text-white font-outfit">$</span>
                                    <h3 className="text-[5.5rem] font-black tracking-tighter leading-none text-white font-outfit">
                                        {Math.floor(grandTotal).toLocaleString()}
                                    </h3>
                                    <span className="text-3xl font-black opacity-40 ml-1 mb-2 font-outfit">
                                        .{((grandTotal * 100) % 100).toFixed(0).padStart(2, '0')}
                                    </span>
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl border bg-primary/20 text-primary border-current/10">
                                        <Wallet className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Expected Deposit</span>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Stats Group */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-8 rounded-[2.5rem] border text-center space-y-2 bg-black/20 border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Hourly Wage</p>
                                    <p className="text-4xl font-black tracking-tighter text-white font-outfit">${data.tipsPerHour.toFixed(0)}<span className="text-sm ml-1 opacity-30 font-outfit">/hr</span></p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] border text-center space-y-2 bg-black/20 border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Sales</p>
                                    <p className="text-4xl font-black tracking-tighter text-white font-outfit">${data.netSales.toFixed(0)}</p>
                                </div>
                            </div>

                            {/* Breakdown Ledger */}
                            <div className="rounded-[3rem] border shadow-inner bg-black/60 border-white/5">
                                <div className="p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-zinc-600">
                                            <div className="w-2 h-2 rounded-full bg-current" /> Shift Breakdown
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-zinc-500">
                                            <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 font-outfit">
                                                <Coins className="w-3.5 h-3.5 opacity-40" /> Credit Card Tips
                                            </span>
                                            <span className="text-xl font-black tracking-tight text-white font-outfit">+${data.ccTips.toFixed(2)}</span>
                                        </div>

                                        {data.basePay > 0 && (
                                            <div className="flex justify-between items-center text-emerald-500/80">
                                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 font-outfit">
                                                    <Landmark className="w-3.5 h-3.5 opacity-40" /> Hourly Wage
                                                </span>
                                                <span className="text-xl font-black tracking-tight font-outfit">+${data.basePay.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center text-red-500/80">
                                            <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 font-outfit">
                                                <MinusCircle className="w-3.5 h-3.5 opacity-40" /> Support Pool
                                            </span>
                                            <span className="text-xl font-black tracking-tight font-outfit">-${data.tipOut.toFixed(2)}</span>
                                        </div>

                                        <div className="h-px w-full my-2 bg-white/5" />

                                        <div className="flex justify-between items-center text-zinc-600">
                                            <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 font-outfit">
                                                <Percent className="w-3.5 h-3.5 opacity-40" /> Est. 15% Tax
                                            </span>
                                            <span className="text-lg font-black tracking-tight font-outfit">-${estimatedTax.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t rounded-b-[3rem] flex items-center justify-between bg-primary/10 border-white/5">
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Expected Deposit</p>
                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Net Bank Deposit</p>
                                    </div>
                                    <p className="text-4xl font-black text-primary font-outfit">${digitalDeposit.toFixed(0)}</p>
                                </div>
                            </div>

                            {/* Trace Information */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between px-10 py-7 rounded-[3rem] border bg-white/[0.04] border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em]">Timestamp</p>
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{format(data.date, 'MMMM do, yyyy')}</p>
                                    </div>
                                    <Badge className="px-6 py-2.5 text-[9px] uppercase font-black border-none rounded-2xl bg-primary/20 text-primary">{data.shiftType}</Badge>
                                </div>
                                
                                <div className="flex flex-col items-center gap-4 py-4 opacity-20">
                                    <div className="h-px w-24 bg-zinc-800" />
                                    <p className="text-[8px] font-black uppercase tracking-[1em] text-center w-full text-white">SHIFT REVIEW</p>
                                </div>
                            </div>
                        </div>

                        {/* App Branding */}
                        <div className="px-12 py-12 border-t text-center flex flex-col items-center gap-6 bg-black/60 border-white/5">
                             <div className="flex items-center gap-6 opacity-20 filter grayscale">
                                 <div className="h-px w-16 bg-white"/>
                                 <span className="text-[13px] font-black uppercase tracking-[0.8em] text-white font-outfit">POOL PARTY OS</span>
                                 <div className="h-px w-16 bg-white"/>
                             </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Actions Zone */}
                <div className="w-full space-y-6 pb-10 flex-shrink-0 relative z-50">
                    <Button 
                        variant="primary"
                        className="w-full py-10 text-2xl rounded-[3rem] items-center justify-center gap-6 shadow-2xl font-outfit font-black group overflow-hidden relative border-t-2 active:scale-95 transition-all text-white border-white/20"
                        onClick={() => {
                            toast.success("Ready for export!")
                        }}
                    >
                        <Download className="w-9 h-9" />
                        Save Record
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    </Button>
                    <button 
                        onClick={onClose}
                        className="w-full py-8 text-[11px] font-black uppercase tracking-[1em] transition-all rounded-[3rem] active:scale-95 flex items-center justify-center gap-4 text-zinc-600 hover:text-white bg-black/60 border border-white/10"
                    >
                        Dismiss <ChevronRight className="w-5 h-5 opacity-40" />
                    </button>
                </div>
            </div>

            {/* Modal Components */}
            <AnimatePresence>
                {showCriteria && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800] backdrop-blur-3xl flex items-center justify-center p-8 bg-black/95" onClick={() => setShowCriteria(false)}>
                        <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }} className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <Card className="!p-12 rounded-[4rem] space-y-10 bg-zinc-950 border-white/10 shadow-3xl text-center">
                                <div className="space-y-2">
                                    <h3 className={cn("text-3xl font-black uppercase tracking-widest text-white")}>SCALING.</h3>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Yield Tier Audit</p>
                                </div>
                                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto no-scrollbar">
                                    {criteria.map((c) => (
                                        <div key={c.grade} className="flex items-center justify-between p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-3xl flex items-center justify-center font-black text-2xl border border-white/10 bg-zinc-900" style={{ color: c.color }}>{c.grade}</div>
                                                <div className="text-left space-y-1">
                                                    <p className="text-[11px] font-black uppercase tracking-wider text-white">{c.label}</p>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase">{c.pct} Yield</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full py-7 rounded-[3rem] font-black uppercase text-xs tracking-widest" onClick={() => setShowCriteria(false)}>Dismiss</Button>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .animate-shimmer { animation: shimmer 3s infinite linear; }
            `}</style>
        </motion.div>
    )
}
