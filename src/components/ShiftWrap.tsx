"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, Badge, cn } from '@/components/PercocoUI'
import { toast } from 'sonner'
import { Download, ChevronRight, DollarSign, Clock, TrendingUp, Sparkles, MinusCircle, Calendar, Info, Wallet, ReceiptText, Percent, Zap, Crown, Ghost, Palmtree, Scan, Shrink, Maximize2 } from 'lucide-react'
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
            bg: 'bg-[#030712]',
            header: 'from-blue-600 via-indigo-700 to-slate-950',
            accent: 'text-primary',
            badge: 'bg-primary/20 text-primary',
            cardBg: 'bg-black/60',
            icon: Sparkles,
            font: 'font-outfit',
            flair: "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"
        },
        cyber: {
            bg: 'bg-black',
            header: 'from-fuchsia-600 via-purple-700 to-indigo-900',
            accent: 'text-fuchsia-400',
            badge: 'bg-fuchsia-500/20 text-fuchsia-400',
            cardBg: 'bg-black/40',
            icon: Zap,
            font: 'font-mono',
            flair: "absolute inset-0 opacity-10 bg-[linear-gradient(rgba(240,171,252,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(240,171,252,0.1)_1px,transparent_1px)] bg-[size:15px_15px]"
        },
        luxe: {
            bg: 'bg-[#0a0904]',
            header: 'from-amber-400 via-amber-700 to-stone-950',
            accent: 'text-amber-400',
            badge: 'bg-amber-500/20 text-amber-500',
            cardBg: 'bg-[#12110c]/80',
            icon: Crown,
            font: 'font-serif',
            flair: "absolute inset-0 bg-gradient-to-t from-transparent via-amber-500/[0.05] to-transparent animate-shimmer"
        },
        thermal: {
            bg: 'bg-[#e5e7eb]',
            header: 'from-zinc-300 via-zinc-400 to-zinc-500',
            accent: 'text-zinc-900',
            badge: 'bg-zinc-900/10 text-zinc-900',
            cardBg: 'bg-white shadow-[inset_0_-10px_40px_rgba(0,0,0,0.05)]',
            icon: ReceiptText,
            font: 'font-mono',
            flair: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-30"
        },
        sunset: {
            bg: 'bg-[#0f0a24]',
            header: 'from-rose-500 via-purple-600 to-indigo-800',
            accent: 'text-rose-400',
            badge: 'bg-rose-400/20 text-rose-400',
            cardBg: 'bg-black/40',
            icon: Palmtree,
            font: 'font-outfit',
            flair: "absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-rose-500/10 to-transparent blur-3xl"
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
                "fixed inset-0 z-[500] backdrop-blur-3xl overflow-y-auto pt-safe pb-40 no-scrollbar touch-pan-y",
                isThermal ? "bg-zinc-200" : "bg-black/98"
            )}
        >
            <div className="flex flex-col items-center min-h-full w-full p-4 sm:p-6">
                
                {/* The "Receipt" Card */}
                <motion.div
                    initial={{ scale: 0.9, y: 30, rotate: template === 'thermal' ? -1 : 0 }}
                    animate={{ scale: 1, y: 0, rotate: template === 'thermal' ? -1 : 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 120 }}
                    className="w-full max-w-[360px] relative mb-12 mt-6 flex-shrink-0"
                >
                    {/* Style Specific Flairs */}
                    <div className={cn("rounded-[3.5rem] overflow-hidden absolute inset-0 pointer-events-none z-0", t.flair)} />
                    
                    {template === 'cyber' && (
                        <motion.div 
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-x-0 top-0 h-1 bg-fuchsia-500 blur-sm z-50 overflow-hidden" 
                        >
                            <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform animate-shimmer" />
                        </motion.div>
                    )}

                    <Card className={cn(
                        "!p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] rounded-[3.5rem] relative z-10 border-white/5",
                        t.bg,
                        isThermal && "border-zinc-300 shadow-xl border-b-4"
                    )}>
                        {/* Header Section */}
                        <div className={cn("bg-gradient-to-br p-8 sm:p-10 text-center relative overflow-hidden", t.header)}>
                            {/* Dot Pattern Overlay */}
                            <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${isThermal ? 'black' : 'white'} 1px, transparent 0)`, backgroundSize: '16px 16px' }} />
                            
                            <motion.div 
                                animate={{ 
                                    rotate: template === 'sunset' ? [0, 5, -5, 0] : [5, -5, 5],
                                    scale: template === 'luxe' ? [1, 1.1, 1] : [1, 1.05, 1],
                                    opacity: [0.1, 0.15, 0.1]
                                }}
                                transition={{ duration: 10, repeat: Infinity }}
                                className="absolute inset-x-0 -top-20 flex items-center justify-center pointer-events-none"
                            >
                                <t.icon className={cn("w-[400px] h-[400px]", isThermal ? "text-black" : "text-white")} />
                            </motion.div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowCriteria(true)}
                                    className={cn(
                                        "w-20 h-20 rounded-[2.2rem] shadow-2xl flex flex-col items-center justify-center mb-8 relative border-4 transition-transform",
                                        isThermal ? "bg-white border-zinc-200" : "bg-white border-white",
                                        template === 'luxe' && "border-amber-400",
                                        template === 'cyber' && "border-fuchsia-500",
                                        template === 'sunset' && "border-rose-400"
                                    )}
                                >
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5 leading-none">Grade</span>
                                    <span className={cn("text-4xl font-black tracking-none leading-none", t.accent, t.font)}>{data.grade}</span>
                                    <div className="absolute -top-2.5 -right-2.5 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                                        <Info className="w-4 h-4" />
                                    </div>
                                </motion.button>
                                
                                <h2 className={cn("text-[9px] font-black uppercase tracking-[0.5em] mb-1", isThermal ? "text-black/40" : "text-white/40", t.font)}>Session Trace</h2>
                                <p className={cn("text-4xl font-black tracking-widest leading-none", isThermal ? "text-black" : "text-white", t.font)}>WRAPPED.</p>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className={cn("p-8 sm:p-10 space-y-10 backdrop-blur-md relative", isThermal ? "bg-white" : "bg-[#111111]/80")}>
                            
                            <div className="text-center relative py-4">
                                <div className={cn("absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full", isThermal ? "bg-zinc-200" : "bg-white/10")} />
                                <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-1", isThermal ? "text-zinc-500" : "text-zinc-500")}>Total Net Deposit</p>
                                <h3 className={cn("text-[4.5rem] font-black tracking-tighter leading-[0.85] mb-6", isThermal ? "text-black" : "text-white", t.font)}>
                                    ${Math.floor(grandTotal).toLocaleString()}
                                    <span className="text-xl opacity-40">.{((grandTotal * 100) % 100).toFixed(0).padStart(2, '0')}</span>
                                </h3>
                                <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-2xl border", t.badge, "border-current/20")}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">Calculated to your wallet</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className={cn("p-6 rounded-[2.5rem] border text-center space-y-1.5", isThermal ? "bg-zinc-50 border-zinc-200" : "bg-white/[0.03] border-white/5")}>
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest text-zinc-600")}>Adj. Hourly</p>
                                    <p className={cn("text-3xl font-black tracking-tighter", isThermal ? "text-black" : "text-white", t.font)}>${data.tipsPerHour.toFixed(0)}<span className="text-xs ml-0.5 opacity-40">/hr</span></p>
                                </div>
                                <div className={cn("p-6 rounded-[2.5rem] border text-center space-y-1.5", isThermal ? "bg-zinc-50 border-zinc-200" : "bg-white/[0.03] border-white/5")}>
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest text-zinc-600")}>Net Sales</p>
                                    <p className={cn("text-3xl font-black tracking-tighter", isThermal ? "text-black" : "text-white", t.font)}>${data.netSales.toFixed(0)}</p>
                                </div>
                            </div>

                            <div className={cn("rounded-[3rem] border overflow-hidden shadow-inner", isThermal ? "bg-white border-zinc-100" : "bg-black/40 border-white/5")}>
                                <div className="p-8 space-y-5">
                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2", isThermal ? "text-zinc-300" : "text-zinc-800")}>
                                        <div className="w-1.5 h-1.5 bg-current rounded-full" /> Ledger Analysis
                                    </p>
                                    
                                    <div className="space-y-3.5">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Gross CC Tips</span>
                                            <span className={cn("text-lg font-black tracking-tight", isThermal ? "text-black" : "text-white", t.font)}>+${data.ccTips.toFixed(2)}</span>
                                        </div>

                                        {data.basePay > 0 && (
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Base Hourly Pay</span>
                                                <span className={cn("text-lg font-black tracking-tight text-emerald-500", t.font)}>+${data.basePay.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center px-1 text-red-500">
                                            <span className="text-[9px] font-bold uppercase tracking-widest">Tip Out Loss</span>
                                            <span className={cn("text-lg font-black tracking-tight", t.font)}>-${data.tipOut.toFixed(2)}</span>
                                        </div>

                                        <div className={cn("h-px w-full my-2", isThermal ? "bg-zinc-100" : "bg-white/5")} />

                                        <div className={cn("flex justify-between items-center px-1 text-zinc-600")}>
                                            <span className="text-[9px] font-bold uppercase tracking-widest italic">15% Est Tax</span>
                                            <span className={cn("text-base font-black tracking-tight", t.font)}>-${estimatedTax.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={cn("p-10 border-t flex items-center justify-between", isThermal ? "bg-zinc-50 border-zinc-100" : "bg-primary/5 border-white/5", template === 'luxe' && "bg-amber-400/5")}>
                                    <div className="space-y-0.5">
                                        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", t.accent)}>Digital Check</p>
                                        <p className="text-[8px] font-bold text-zinc-600 uppercase">Estimated</p>
                                    </div>
                                    <p className={cn("text-3xl font-black", t.accent, t.font)}>${digitalDeposit.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className={cn("flex items-center justify-between px-8 py-6 rounded-[2.5rem] border", isThermal ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800/40 border-white/5")}>
                                    <div className="space-y-1">
                                        <p className={cn("text-[8px] font-black uppercase tracking-[0.3em]", isThermal ? "text-zinc-400" : "text-zinc-700")}>Timestamp</p>
                                        <p className={cn("text-xs font-black uppercase tracking-widest", isThermal ? "text-zinc-900" : "text-zinc-300")}>{format(data.date, 'MMM do, yyyy')}</p>
                                    </div>
                                    <Badge className={cn("border-none text-[9px] font-black uppercase px-5 py-2.5 rounded-2xl", t.badge)}>{data.shiftType}</Badge>
                                </div>
                                
                                <div className="flex flex-col items-center gap-3 opacity-20">
                                    <div className="h-px w-20 bg-current" />
                                    <Scan className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Branding */}
                        <div className={cn("px-10 py-12 border-t text-center", isThermal ? "bg-white border-zinc-100" : "bg-black/60 border-white/5")}>
                             <span className={cn("text-[10px] font-black uppercase tracking-[1em] opacity-30", isThermal ? "text-black" : "text-white", t.font)}>POOL PARTY OS</span>
                        </div>
                    </Card>
                </motion.div>

                {/* Actions Bar */}
                <div className="w-full max-w-[360px] space-y-5 pb-24 flex-shrink-0">
                    <Button 
                        variant={isThermal ? 'secondary' : 'primary'}
                        className={cn(
                            "w-full py-8 text-xl rounded-[3rem] flex items-center justify-center gap-5 shadow-2xl font-outfit font-black active:scale-95 transition-all overflow-hidden relative border-t-2",
                            isThermal ? "bg-zinc-900 text-white border-white/10" : "border-white/20"
                        )}
                        onClick={() => {
                            toast.success("Ready for export!", {
                                description: "Screenshot this record for your records."
                            })
                        }}
                    >
                        <Download className="w-8 h-8" />
                        Save to Photos
                        {!isThermal && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />}
                    </Button>
                    <button 
                        onClick={onClose}
                        className={cn(
                            "w-full py-6 text-[10px] font-black uppercase tracking-[0.8em] transition-all rounded-[3rem] active:scale-95 flex items-center justify-center gap-3",
                            isThermal ? "bg-white border border-zinc-200 text-zinc-600" : "bg-black/40 border border-white/10 text-zinc-600 hover:text-white"
                        )}
                    >
                        Dismiss <ChevronRight className="w-4 h-4 opacity-40" />
                    </button>
                </div>
            </div>

            {/* Grade Criteria Modal */}
            <AnimatePresence>
                {showCriteria && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn("fixed inset-0 z-[600] backdrop-blur-3xl flex items-center justify-center p-6", isThermal ? "bg-white/90" : "bg-black/95")}
                        onClick={() => setShowCriteria(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="w-full max-w-sm"
                            onClick={e => e.stopPropagation()}
                        >
                            <Card className={cn(
                                "!p-10 rounded-[4rem] space-y-8 shadow-[0_50px_150px_rgba(0,0,0,0.9)] relative overflow-hidden border",
                                isThermal ? "bg-white border-zinc-200" : "bg-zinc-950 border-white/10"
                            )}>
                                <div className="text-center space-y-3">
                                    <h3 className={cn("text-3xl font-black tracking-widest uppercase", isThermal ? "text-black" : "text-white", t.font)}>Scaling.</h3>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Yield Scale</p>
                                </div>
                                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                                    {criteria.map((c) => (
                                        <div key={c.grade} className={cn("flex items-center justify-between p-4 rounded-[2.5rem] border", isThermal ? "bg-zinc-50 border-zinc-100" : "bg-white/[0.02] border-white/5")}>
                                            <div className="flex items-center gap-6">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border shadow-inner", isThermal ? "bg-white border-zinc-200" : "bg-zinc-900 border-white/5")} style={{ color: c.color }}>{c.grade}</div>
                                                <div className="space-y-0.5">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-wider", isThermal ? "text-black" : "text-white")}>{c.label}</p>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase">{c.pct} Yield</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest" onClick={() => setShowCriteria(false)}>Dismiss</Button>
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
