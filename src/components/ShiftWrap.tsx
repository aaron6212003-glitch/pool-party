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
            flair: "absolute inset-0 opacity-10 bg-[linear-gradient(rgba(240,171,252,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(240,171,252,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
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
                "fixed inset-0 z-[100] backdrop-blur-3xl flex flex-col items-center justify-start p-6 overflow-x-hidden overflow-y-auto pt-safe pb-20 no-scrollbar select-none",
                isThermal ? "bg-zinc-200" : "bg-black/99"
            )}
        >
            {/* The "Receipt" Card */}
            <motion.div
                initial={{ scale: 0.9, y: 50, rotate: template === 'thermal' ? -1 : 0 }}
                animate={{ scale: 1, y: 0, rotate: template === 'thermal' ? -1 : 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="w-full max-w-[380px] relative mb-12 mt-4 flex-shrink-0"
            >
                {/* Style Specific Flairs */}
                <div className={cn("rounded-[4rem] overflow-hidden absolute inset-0 pointer-events-none z-0", t.flair)} />
                
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
                    "!p-0 overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.9)] rounded-[4rem] relative z-10 border-white/5",
                    t.bg,
                    isThermal && "border-zinc-300 shadow-xl border-b-8"
                )}>
                    {/* Header Section */}
                    <div className={cn("bg-gradient-to-br p-12 text-center relative overflow-hidden", t.header)}>
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
                            <t.icon className={cn("w-[500px] h-[500px]", isThermal ? "text-black" : "text-white")} />
                        </motion.div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowCriteria(true)}
                                className={cn(
                                    "w-24 h-24 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center mb-10 relative border-4 transition-transform",
                                    isThermal ? "bg-white border-zinc-200" : "bg-white border-white",
                                    template === 'luxe' && "border-amber-400",
                                    template === 'cyber' && "border-fuchsia-500",
                                    template === 'sunset' && "border-rose-400"
                                )}
                            >
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5">Grade</span>
                                <span className={cn("text-5xl font-black tracking-none leading-none", t.accent, t.font)}>{data.grade}</span>
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                                    <Info className="w-5 h-5" />
                                </div>
                            </motion.button>
                            
                            <h2 className={cn("text-[11px] font-black uppercase tracking-[0.6em] mb-2", isThermal ? "text-black/40" : "text-white/40", t.font)}>Session Trace</h2>
                            <p className={cn("text-5xl font-black tracking-widest", isThermal ? "text-black" : "text-white", t.font)}>WRAPPED.</p>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className={cn("p-12 space-y-12 backdrop-blur-md relative", isThermal ? "bg-white" : "bg-[#111111]/80")}>
                        
                        <div className="text-center relative py-6">
                            <div className={cn("absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full", isThermal ? "bg-zinc-200" : "bg-white/10")} />
                            <p className={cn("text-[11px] font-black uppercase tracking-[0.4em] mb-1", isThermal ? "text-zinc-500" : "text-zinc-500")}>Total Net Deposit</p>
                            <h3 className={cn("text-[6rem] font-black tracking-tighter leading-[0.85] mb-6", isThermal ? "text-black" : "text-white", t.font)}>
                                ${Math.floor(grandTotal).toLocaleString()}
                                <span className="text-3xl opacity-40">.{((grandTotal % 1) * 100).toFixed(0).padStart(2, '0')}</span>
                            </h3>
                            <div className={cn("inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl border", t.badge, "border-current/20")}>
                                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                    <Sparkles className="w-4 h-4" />
                                </motion.div>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Calculated to your wallet</span>
                            </div>
                        </div>

                        {/* Primary KPI Boxes */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className={cn("p-8 rounded-[3rem] border text-center space-y-2 relative overflow-hidden group", isThermal ? "bg-zinc-50 border-zinc-200" : "bg-white/[0.03] border-white/5", template === 'cyber' && "border-fuchsia-500/20")}>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest", isThermal ? "text-zinc-500" : "text-zinc-600")}>Adj. Hourly</p>
                                <p className={cn("text-4xl font-black tracking-tighter", isThermal ? "text-black" : "text-white", t.font)}>${data.tipsPerHour.toFixed(0)}<span className={cn("text-xs ml-1 opacity-40")}>/hr</span></p>
                            </div>
                            <div className={cn("p-8 rounded-[3rem] border text-center space-y-2 relative overflow-hidden group", isThermal ? "bg-zinc-50 border-zinc-200" : "bg-white/[0.03] border-white/5", template === 'sunset' && "border-rose-500/20")}>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest", isThermal ? "text-zinc-500" : "text-zinc-600")}>Net Sales</p>
                                <p className={cn("text-4xl font-black tracking-tighter", isThermal ? "text-black" : "text-white", t.font)}>${data.netSales.toFixed(0)}</p>
                            </div>
                        </div>

                        {/* Ledger */}
                        <div className={cn("rounded-[3.5rem] border overflow-hidden shadow-inner", isThermal ? "bg-white border-zinc-200" : "bg-black/40 border-white/5")}>
                            <div className="p-10 space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3", isThermal ? "text-zinc-400" : "text-zinc-700")}>
                                        <div className="w-1.5 h-1.5 bg-current rounded-full" /> Financial Ledger
                                    </p>
                                    <Badge className={cn("text-[8px] font-black tracking-widest uppercase py-1", t.badge)}>Verified</Badge>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className={cn("text-[10px] font-bold uppercase tracking-widest text-zinc-500")}>Gross CC Tips</span>
                                        <span className={cn("text-xl font-black tracking-tight", isThermal ? "text-black" : "text-white", t.font)}>+${data.ccTips.toFixed(2)}</span>
                                    </div>

                                    {data.basePay > 0 && (
                                        <div className="flex justify-between items-center px-1">
                                            <span className={cn("text-[10px] font-bold uppercase tracking-widest text-zinc-500")}>Base Hourly Pay</span>
                                            <span className={cn("text-xl font-black tracking-tight text-emerald-500", t.font)}>+${data.basePay.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center px-1 text-red-500">
                                        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <MinusCircle className="w-4 h-4 opacity-40" /> Tip Out Loss
                                        </span>
                                        <span className={cn("text-xl font-black tracking-tight", t.font)}>-${data.tipOut.toFixed(2)}</span>
                                    </div>

                                    <div className={cn("h-px w-full my-6", isThermal ? "bg-zinc-100" : "bg-white/5")} />

                                    <div className="flex justify-between items-center px-1">
                                        <span className={cn("text-[11px] font-black uppercase tracking-[0.2em]", isThermal ? "text-zinc-900" : "text-white")}>Actual earnings</span>
                                        <span className={cn("text-xl font-black tracking-tight", isThermal ? "text-black" : "text-white", t.font)}>${preTaxCheck.toFixed(2)}</span>
                                    </div>

                                    <div className={cn("flex justify-between items-center px-1", isThermal ? "text-zinc-400" : "text-zinc-600")}>
                                        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <Percent className="w-4 h-4 opacity-30" /> Est. 15% Tax
                                        </span>
                                        <span className={cn("text-lg font-black tracking-tight", t.font)}>-${estimatedTax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={cn("p-12 border-t space-y-6", isThermal ? "bg-zinc-50 border-zinc-100" : "bg-primary/10 border-white/5", template === 'luxe' && "bg-amber-400/5", template === 'cyber' && "bg-fuchsia-500/5")}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className={cn("text-xs font-black uppercase tracking-[0.2em] mb-1", isThermal ? "text-zinc-900" : "text-primary", t.accent)}>Digital Deposit</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Expected from Employer</p>
                                    </div>
                                    <p className={cn("text-4xl font-black", isThermal ? "text-black" : "text-primary", t.accent, t.font)}>${digitalDeposit.toFixed(2)}</p>
                                </div>

                                <div className={cn("grid grid-cols-2 gap-4 pt-6 border-t", isThermal ? "border-zinc-200" : "border-white/5")}>
                                    <div className="space-y-1">
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest text-zinc-600")}>Cash Walk</p>
                                        <p className={cn("text-2xl font-black", isThermal ? "text-zinc-900" : "text-white", t.font)}>${cashInHand.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest text-zinc-500")}>Night Net</p>
                                        <p className={cn("text-2xl font-black text-emerald-500", t.font)}>${grandTotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex flex-col gap-6">
                            <div className={cn("flex items-center justify-between px-10 py-8 rounded-[3.5rem] border relative overflow-hidden group", isThermal ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800/40 border-white/5")}>
                                <div className="space-y-1 relative z-10">
                                    <p className={cn("text-[8px] font-black uppercase tracking-[0.4em]", isThermal ? "text-zinc-400" : "text-zinc-700")}>Timestamp</p>
                                    <p className={cn("text-xs font-black uppercase tracking-widest", isThermal ? "text-zinc-900" : "text-zinc-300")}>{format(data.date, 'MMM do, yyyy')}</p>
                                </div>
                                <Badge className={cn("border-none text-[10px] font-black uppercase px-6 py-3 rounded-2xl relative z-10", t.badge)}>{data.shiftType}</Badge>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            </div>
                            
                            <div className="flex flex-col items-center gap-4 py-4 opacity-30">
                                <div className={cn("h-px w-32", isThermal ? "bg-black" : "bg-white")} />
                                <div className="flex items-center gap-8 py-2">
                                    <Scan className="w-5 h-5" />
                                    <div className="w-48 h-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e9/UPC-A-barcode.svg')] bg-repeat-x opacity-40 invert-0" style={{ filter: isThermal ? 'none' : 'invert(1)' }} />
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <p className={cn("text-[8px] font-black uppercase tracking-[1em] text-center w-full", isThermal ? "text-black" : "text-white")}>INTELLIGENCE</p>
                            </div>
                        </div>
                    </div>

                    {/* Branding */}
                    <div className={cn("px-12 py-16 border-t text-center relative overflow-hidden", isThermal ? "bg-white border-zinc-200" : "bg-black/60 border-white/5")}>
                         <span className={cn("text-[12px] font-black uppercase tracking-[0.8em] opacity-30 select-none", isThermal ? "text-black" : "text-white", t.font)}>POOL PARTY OS</span>
                    </div>
                </Card>
            </motion.div>

            {/* Actions Bar */}
            <div className="w-full max-w-[380px] space-y-6 pb-24 flex-shrink-0 relative z-50">
                <Button 
                    variant={isThermal ? 'secondary' : 'primary'}
                    className={cn(
                        "w-full py-10 text-2xl rounded-[3.5rem] flex items-center justify-center gap-6 shadow-2xl font-outfit font-black group overflow-hidden relative border-t-2 active:scale-95 transition-all",
                        isThermal ? "bg-zinc-900 text-white border-white/20" : "border-white/20"
                    )}
                    onClick={() => {
                        toast.success("Memory captured! 🎉", {
                            description: "Take a screenshot and share the results."
                        })
                    }}
                >
                    <Download className="w-10 h-10 group-hover:translate-y-1 transition-transform" />
                    Archive Record
                    {!isThermal && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />}
                </Button>
                <button 
                    onClick={onClose}
                    className={cn(
                        "w-full py-8 text-xs font-black uppercase tracking-[1em] transition-all rounded-[3.5rem] active:scale-95 flex items-center justify-center gap-4",
                        isThermal ? "bg-white border-2 border-zinc-300 text-zinc-600" : "bg-black/60 border border-white/10 text-zinc-600 hover:text-white"
                    )}
                >
                    Dismiss <ChevronRight className="w-5 h-5 opacity-40" />
                </button>
            </div>

            {/* Grade Criteria Modal */}
            <AnimatePresence>
                {showCriteria && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn("fixed inset-0 z-[120] backdrop-blur-3xl flex items-center justify-center p-8", isThermal ? "bg-zinc-100/90" : "bg-black/95")}
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
                                "!p-12 rounded-[4.5rem] space-y-10 shadow-[0_60px_180px_rgba(0,0,0,0.95)] relative overflow-hidden border",
                                isThermal ? "bg-white border-zinc-200 shadow-2xl" : "bg-zinc-950 border-white/10"
                            )}>
                                {!isThermal && <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />}
                                
                                <div className="text-center space-y-4 relative z-10">
                                    <h3 className={cn("text-4xl font-black tracking-widest uppercase", isThermal ? "text-black" : "text-white", t.font)}>Scaling.</h3>
                                    <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] px-8 py-2", isThermal ? "text-zinc-400" : "text-zinc-600")}>Yield Percentage Scale</p>
                                </div>
                                
                                <div className="space-y-2 relative z-10 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                                    {criteria.map((c) => (
                                        <div key={c.grade} className={cn("flex items-center justify-between p-5 rounded-[2.5rem] border transition-all hover:scale-105", isThermal ? "bg-zinc-50 border-zinc-100" : "bg-white/[0.03] border-white/5")}>
                                            <div className="flex items-center gap-6">
                                                <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center font-black text-2xl shadow-inner border transition-colors", isThermal ? "bg-white border-zinc-200" : "bg-zinc-900 border-white/10", t.font)} style={{ color: c.color }}>
                                                    {c.grade}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className={cn("text-xs font-black uppercase tracking-wider", isThermal ? "text-black" : "text-white")}>{c.label}</p>
                                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{c.pct} Yield</p>
                                                </div>
                                            </div>
                                            <TrendingUp className="w-5 h-5 text-current opacity-20" style={{ color: c.color }} />
                                        </div>
                                    ))}
                                </div>

                                <Button className="w-full py-8 rounded-[3rem] font-black uppercase text-xs tracking-[0.5em]" onClick={() => setShowCriteria(false)}>
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
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite linear;
                }
            `}</style>
        </motion.div>
    )
}
