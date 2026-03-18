"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, Badge, cn } from '@/components/PercocoUI'
import { toast } from 'sonner'
import { Download, ChevronRight, DollarSign, Clock, TrendingUp, Sparkles, MinusCircle, Calendar, Info, Wallet, ReceiptText, Percent, Zap, Crown, Ghost, Palmtree } from 'lucide-react'
import { format } from 'date-fns'

export type WrapTemplate = 'obsidian' | 'cyber' | 'luxe' | 'thermal' | 'sunset'

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
    template?: WrapTemplate;
    onClose: () => void;
}

export default function ShiftWrap({ data, template = 'obsidian', onClose }: ShiftWrapProps) {
    const [showCriteria, setShowCriteria] = useState(false)
    
    // Consistent calculations
    const preTaxCheck = (data.ccTips + data.basePay) - data.tipOut
    const estimatedTax = Math.max(0, preTaxCheck * 0.15)
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
        { pct: '10%+', grade: 'D', color: '#F87171', label: 'Tough Shift' },
        { pct: '< 10%', grade: 'F', color: '#EF4444', label: 'Struggled' },
    ]

    // Theme Configs
    const themes: Record<WrapTemplate, any> = {
        obsidian: {
            bg: 'bg-zinc-900',
            header: 'from-primary via-blue-700 to-indigo-950',
            accent: 'text-primary',
            badge: 'bg-primary/20 text-primary',
            cardBg: 'bg-black/40',
            icon: Sparkles,
            font: 'font-outfit'
        },
        cyber: {
            bg: 'bg-black',
            header: 'from-fuchsia-600 via-purple-700 to-indigo-900',
            accent: 'text-fuchsia-400',
            badge: 'bg-fuchsia-500/20 text-fuchsia-400',
            cardBg: 'bg-fuchsia-500/5',
            icon: Zap,
            font: 'font-mono'
        },
        luxe: {
            bg: 'bg-[#1a1510]',
            header: 'from-amber-600 via-amber-800 to-zinc-950',
            accent: 'text-amber-400',
            badge: 'bg-amber-500/20 text-amber-500',
            cardBg: 'bg-amber-950/20',
            icon: Crown,
            font: 'font-serif'
        },
        thermal: {
            bg: 'bg-zinc-100',
            header: 'from-zinc-300 via-zinc-400 to-zinc-500',
            accent: 'text-zinc-900',
            badge: 'bg-zinc-900/10 text-zinc-900',
            cardBg: 'bg-white',
            icon: ReceiptText,
            font: 'font-mono'
        },
        sunset: {
            bg: 'bg-[#0f0a24]',
            header: 'from-rose-500 via-purple-600 to-indigo-800',
            accent: 'text-rose-400',
            badge: 'bg-rose-500/20 text-rose-400',
            cardBg: 'bg-white/5',
            icon: Palmtree,
            font: 'font-outfit'
        }
    }

    const t = themes[template]
    const isThermal = template === 'thermal'

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                "fixed inset-0 z-[100] backdrop-blur-3xl flex flex-col items-center justify-start p-6 overflow-x-hidden overflow-y-auto pt-safe pb-20 no-scrollbar",
                isThermal ? "bg-zinc-200" : "bg-black/99"
            )}
        >
            {/* The "Receipt" Card */}
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="w-full max-w-[380px] relative mb-12 mt-4 flex-shrink-0"
            >
                {/* Style Specific Flairs */}
                {template === 'cyber' && (
                    <div className="absolute inset-0 border-2 border-fuchsia-500/20 rounded-[4rem] animate-pulse pointer-events-none" />
                )}
                
                <Card className={cn(
                    "!p-0 overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.9)] rounded-[4rem] relative z-10 border-white/5",
                    t.bg,
                    isThermal && "border-zinc-300 shadow-xl"
                )}>
                    {/* Header Section */}
                    <div className={cn("bg-gradient-to-br p-12 text-center relative overflow-hidden", t.header)}>
                        {/* Dot Pattern Overlay */}
                        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${isThermal ? 'black' : 'white'} 1px, transparent 0)`, backgroundSize: '16px 16px' }} />
                        
                        <motion.div 
                            animate={{ rotate: [5, -5, 5], scale: [1, 1.05, 1] }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute inset-x-0 -top-20 opacity-10 flex items-center justify-center pointer-events-none"
                        >
                            <t.icon className={cn("w-[500px] h-[500px]", isThermal ? "text-black" : "text-white")} />
                        </motion.div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowCriteria(true)}
                                className={cn(
                                    "w-24 h-24 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center mb-8 relative border-4 transition-transform",
                                    isThermal ? "bg-white border-zinc-200" : "bg-white border-white"
                                )}
                            >
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5">Grade</span>
                                <span className={cn("text-4xl font-black tracking-none leading-none", t.accent, t.font)}>{data.grade}</span>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                                    <Info className="w-4 h-4" />
                                </div>
                            </motion.button>
                            
                            <h2 className={cn("text-[11px] font-black uppercase tracking-[0.6em] mb-2", isThermal ? "text-black/40" : "text-white/40", t.font)}>Shift Session</h2>
                            <p className={cn("text-5xl font-black tracking-widest", isThermal ? "text-black" : "text-white", t.font)}>WRAPPED.</p>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className={cn("p-12 space-y-12 backdrop-blur-sm", isThermal ? "bg-white" : "bg-zinc-900/50")}>
                        
                        <div className="text-center relative py-4">
                            <div className={cn("absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full", isThermal ? "bg-zinc-200" : "bg-white/5")} />
                            <p className={cn("text-[11px] font-black uppercase tracking-[0.4em] mb-1", isThermal ? "text-zinc-400" : "text-zinc-600")}>Estimated Net Profit</p>
                            <h3 className={cn("text-[5.5rem] font-black tracking-tighter leading-none mb-4", isThermal ? "text-black" : "text-white", t.font)}>
                                ${Math.floor(grandTotal).toLocaleString()}
                            </h3>
                            <div className={cn("inline-flex items-center gap-2 px-5 py-2 rounded-2xl border", t.badge, "border-current/10")}>
                                <Wallet className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Locked to your digital wallet</span>
                            </div>
                        </div>

                        {/* Primary KPI Boxes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={cn("p-8 rounded-[2.5rem] border text-center space-y-2 relative overflow-hidden group", isThermal ? "bg-zinc-50 border-zinc-200" : "bg-white/[0.03] border-white/5")}>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest", isThermal ? "text-zinc-500" : "text-zinc-600")}>Adj. Hourly</p>
                                <p className={cn("text-3xl font-black tracking-tighter", isThermal ? "text-black" : "text-white", t.font)}>${data.tipsPerHour.toFixed(0)}<span className={cn("text-xs ml-1", isThermal ? "text-zinc-400" : "text-zinc-600")}>/hr</span></p>
                            </div>
                            <div className={cn("p-8 rounded-[2.5rem] border text-center space-y-2 relative overflow-hidden group", isThermal ? "bg-zinc-50 border-zinc-200" : "bg-white/[0.03] border-white/5")}>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest", isThermal ? "text-zinc-500" : "text-zinc-600")}>Total Sales</p>
                                <p className={cn("text-3xl font-black tracking-tighter", isThermal ? "text-black" : "text-white", t.font)}>${data.netSales.toFixed(0)}</p>
                            </div>
                        </div>

                        {/* Ledger */}
                        <div className={cn("rounded-[3rem] border overflow-hidden shadow-inner", isThermal ? "bg-white border-zinc-200" : "bg-black/40 border-white/5")}>
                            <div className="p-10 space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2", isThermal ? "text-zinc-400" : "text-zinc-600")}>
                                        <ReceiptText className="w-3 h-3" /> Check Ledger
                                    </p>
                                    <div className={cn("w-2 h-2 rounded-full animate-pulse", isThermal ? "bg-zinc-300" : "bg-primary/30")} />
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className={cn("text-[11px] font-bold uppercase tracking-widest", isThermal ? "text-zinc-400" : "text-zinc-500")}>Gross CC Tips</span>
                                        <span className={cn("text-lg font-black tracking-tight", isThermal ? "text-black" : "text-white", t.font)}>+${data.ccTips.toFixed(2)}</span>
                                    </div>

                                    {data.basePay > 0 && (
                                        <div className="flex justify-between items-center px-1">
                                            <span className={cn("text-[11px] font-bold uppercase tracking-widest", isThermal ? "text-zinc-400" : "text-zinc-500")}>Base Hourly Pay</span>
                                            <span className={cn("text-lg font-black tracking-tight", isThermal ? "text-emerald-500/80" : "text-emerald-400", t.font)}>+${data.basePay.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center px-1 text-red-500">
                                        <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <MinusCircle className="w-3.5 h-3.5 opacity-40" /> Tip Out Loss
                                        </span>
                                        <span className={cn("text-lg font-black tracking-tight", t.font)}>-${data.tipOut.toFixed(2)}</span>
                                    </div>

                                    <div className={cn("h-px w-full my-2", isThermal ? "bg-zinc-100" : "bg-white/5")} />

                                    <div className="flex justify-between items-center px-1">
                                        <span className={cn("text-[11px] font-black uppercase tracking-widest", isThermal ? "text-zinc-900" : "text-white")}>Pre-Tax Check</span>
                                        <span className={cn("text-lg font-black tracking-tight", isThermal ? "text-black" : "text-white", t.font)}>${preTaxCheck.toFixed(2)}</span>
                                    </div>

                                    <div className={cn("flex justify-between items-center px-1", isThermal ? "text-zinc-500" : "text-indigo-400")}>
                                        <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <Percent className="w-3.5 h-3.5 opacity-40" /> Est. 15% Tax
                                        </span>
                                        <span className={cn("text-base font-black tracking-tight", t.font)}>-${estimatedTax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={cn("p-10 border-t space-y-6", isThermal ? "bg-zinc-50 border-zinc-100" : "bg-primary/10 border-white/5")}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-1", isThermal ? "text-zinc-900" : "text-primary")}>Expected Deposit</p>
                                        <p className={cn("text-[8px] font-bold uppercase tracking-widest opacity-50", isThermal ? "text-zinc-500" : "text-primary")}>Check Only</p>
                                    </div>
                                    <p className={cn("text-3xl font-black", isThermal ? "text-black" : "text-primary", t.font)}>${digitalDeposit.toFixed(2)}</p>
                                </div>

                                <div className={cn("grid grid-cols-2 gap-4 pt-4 border-t", isThermal ? "border-zinc-200" : "border-primary/10")}>
                                    <div className="space-y-1">
                                        <p className={cn("text-[9px] font-black uppercase tracking-widest", isThermal ? "text-zinc-400" : "text-zinc-600")}>Cash In Hand</p>
                                        <p className={cn("text-xl font-black", isThermal ? "text-zinc-900" : "text-white", t.font)}>${cashInHand.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className={cn("text-[9px] font-black uppercase tracking-widest", isThermal ? "text-zinc-500" : "text-emerald-500")}>Total Night</p>
                                        <p className={cn("text-xl font-black", isThermal ? "text-zinc-900" : "text-emerald-400", t.font)}>${grandTotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-col gap-4">
                            <div className={cn("flex items-center justify-between px-8 py-6 rounded-[2.5rem] border", isThermal ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800/40 border-white/5")}>
                                <div className="space-y-1">
                                    <p className={cn("text-[8px] font-black uppercase tracking-widest", isThermal ? "text-zinc-400" : "text-zinc-700")}>Artifact Trace</p>
                                    <p className={cn("text-[11px] font-black uppercase tracking-[0.1em]", isThermal ? "text-zinc-900" : "text-zinc-400")}>{format(data.date, 'MMMM do, yyyy')}</p>
                                </div>
                                <Badge className={cn("border-none text-[9px] font-black uppercase px-5 py-2.5 rounded-2xl", t.badge)}>{data.shiftType}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Branding */}
                    <div className={cn("px-12 py-16 border-t text-center flex flex-col items-center gap-6 relative overflow-hidden", isThermal ? "bg-white border-zinc-200" : "bg-black/60 border-white/5")}>
                        <div className="flex items-center gap-6 relative z-10 grayscale opacity-20">
                             <div className={cn("h-px w-20", isThermal ? "bg-zinc-200" : "bg-zinc-800")} />
                             <span className={cn("text-[11px] font-bold uppercase tracking-[1em]", isThermal ? "text-black" : "text-white", t.font)}>POOL PARTY</span>
                             <div className={cn("h-px w-20", isThermal ? "bg-zinc-200" : "bg-zinc-800")} />
                        </div>
                        <p className={cn("text-[7px] font-black uppercase tracking-[0.5em] relative z-10 opacity-40", isThermal ? "text-zinc-400" : "text-zinc-800")}>INTELLIGENCE REPORT v1.1.2</p>
                    </div>
                </Card>
            </motion.div>

            {/* Actions Bar */}
            <div className="w-full max-w-[380px] space-y-4 pb-16 flex-shrink-0">
                <Button 
                    variant={isThermal ? 'secondary' : 'primary'}
                    className={cn(
                        "w-full py-8 text-2xl rounded-[3rem] flex items-center justify-center gap-5 shadow-[0_30px_100px_rgba(0,122,255,0.4)] font-outfit font-black group overflow-hidden relative border-t-2",
                        isThermal ? "bg-zinc-900 text-white border-white/10" : "border-white/20"
                    )}
                    onClick={() => {
                        toast.success("Ready for export!", {
                            description: "Screenshot this record for your records."
                        })
                    }}
                >
                    <Download className="w-9 h-9" />
                    Save to Photos
                    {!isThermal && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />}
                </Button>
                <button 
                    onClick={onClose}
                    className={cn(
                        "w-full py-6 text-[12px] font-black uppercase tracking-[0.6em] transition-all rounded-[3rem] active:scale-95 flex items-center justify-center gap-3",
                        isThermal ? "bg-white border border-zinc-200 text-zinc-600" : "bg-zinc-950 border border-white/5 text-zinc-600 hover:text-white"
                    )}
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
                        className={cn("fixed inset-0 z-[120] backdrop-blur-3xl flex items-center justify-center p-6", isThermal ? "bg-zinc-100/90" : "bg-black/95")}
                        onClick={() => setShowCriteria(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="w-full max-w-sm"
                            onClick={e => e.stopPropagation()}
                        >
                            <Card className={cn(
                                "!p-10 rounded-[4rem] space-y-10 shadow-[0_50px_150px_rgba(0,0,0,0.8)] relative overflow-hidden border",
                                isThermal ? "bg-white border-zinc-200" : "bg-zinc-900 border-white/10"
                            )}>
                                {!isThermal && <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />}
                                
                                <div className="text-center space-y-3 relative z-10">
                                    <h3 className={cn("text-3xl font-black tracking-widest uppercase", isThermal ? "text-black" : "text-white", t.font)}>Scaling.</h3>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest px-6", isThermal ? "text-zinc-400" : "text-zinc-500")}>Calculated by Net Tip % vs Total Sales.</p>
                                </div>
                                
                                <div className="space-y-2 relative z-10">
                                    {criteria.map((c) => (
                                        <div key={c.grade} className={cn("flex items-center justify-between p-4 rounded-3xl border", isThermal ? "bg-zinc-50 border-zinc-100" : "bg-white/[0.02] border-white/10")}>
                                            <div className="flex items-center gap-5">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner border", isThermal ? "bg-white border-zinc-200" : "bg-zinc-900 border-white/5", t.font)} style={{ color: c.color }}>
                                                    {c.grade}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider", isThermal ? "text-black" : "text-white")}>{c.label}</p>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{c.pct} Yield</p>
                                                </div>
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-zinc-900 opacity-20" />
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
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </motion.div>
    )
}
