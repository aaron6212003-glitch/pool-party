"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, Badge } from '@/components/PercocoUI'
import { toast } from 'sonner'
import { Download, CheckCircle2, DollarSign, Clock, TrendingUp, Sparkles, Receipt, MinusCircle, Wallet, Calendar } from 'lucide-react'
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
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-start p-6 overflow-y-auto pt-10 pb-20 no-scrollbar"
        >
            {/* The "Receipt" Card */}
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="w-full max-w-[360px] relative mb-12"
            >
                {/* Visual Polish */}
                <div className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-full opacity-40 pointer-events-none" />
                
                <Card className="!p-0 overflow-hidden bg-zinc-900 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[3rem] relative z-10">
                    {/* Header: Visual Impact */}
                    <div className="bg-gradient-to-br from-primary via-blue-600 to-indigo-900 p-10 text-center relative overflow-hidden">
                        <motion.div 
                            animate={{ rotate: [12, -12, 12], scale: [1, 1.2, 1] }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 opacity-10 flex items-center justify-center"
                        >
                            <Sparkles className="w-96 h-96 text-white" />
                        </motion.div>
                        
                        <div className="relative z-10">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", delay: 0.3 }}
                                className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl"
                            >
                                <Receipt className="w-8 h-8 text-primary" />
                            </motion.div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60 mb-2 font-outfit">Shift Summary</h2>
                            <p className="text-4xl font-black text-white tracking-[0.1em] font-outfit">WRAPPED.</p>
                        </div>
                    </div>

                    {/* Grade Badge */}
                    <div className="absolute top-[180px] left-1/2 -translate-x-1/2 z-20">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="px-6 py-2 rounded-2xl bg-black border-2 border-white/10 shadow-2xl flex items-center gap-3"
                        >
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Grade</span>
                            <span className="text-2xl font-black font-outfit leading-none" style={{ color: data.gradeColor }}>{data.grade}</span>
                        </motion.div>
                    </div>

                    {/* Stats Body */}
                    <div className="p-10 pt-16 space-y-10">
                        {/* The Big Number */}
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Takehome Total</p>
                            <h3 className="text-7xl font-black font-outfit text-white tracking-tighter leading-none">
                                ${data.totalEarned.toFixed(0)}
                            </h3>
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Shift Performance</span>
                            </div>
                        </div>

                        {/* Efficiency & Sales Row */}
                        <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-8">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-primary" /> Adjusted Rate
                                </p>
                                <p className="text-2xl font-black font-outfit text-white tracking-tight">${data.tipsPerHour.toFixed(0)}<span className="text-xs text-zinc-600">/hr</span></p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2 justify-end">
                                    <DollarSign className="w-3 h-3 text-emerald-500" /> Total Net Sales
                                </p>
                                <p className="text-2xl font-black font-outfit text-white tracking-tight">${data.netSales.toFixed(0)}</p>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="space-y-5 bg-black/40 rounded-[2.5rem] p-8 border border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700 mb-2">Shift Breakdown</p>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Credit Card Tips</span>
                                <span className="text-sm font-black text-white font-outfit">${data.ccTips.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Cash Tips</span>
                                <span className="text-sm font-black text-white font-outfit">${data.cashTips.toFixed(2)}</span>
                            </div>

                            {data.tipOut > 0 && (
                                <div className="flex justify-between items-center text-red-400">
                                    <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                                        <MinusCircle className="w-3 h-3" /> Support Tip Out
                                    </span>
                                    <span className="text-sm font-black font-outfit">-${data.tipOut.toFixed(2)}</span>
                                </div>
                            )}

                            {data.basePay > 0 && (
                                <div className="flex justify-between items-center text-emerald-400">
                                    <span className="text-xs font-bold uppercase tracking-wide">Hourly Wage Base</span>
                                    <span className="text-sm font-black font-outfit">+${data.basePay.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Net Takehome</span>
                                <span className="text-xl font-black text-white font-outfit">${data.totalEarned.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Log Info */}
                        <div className="flex justify-between items-center px-4 py-4 bg-zinc-800/30 rounded-2xl">
                           <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">{format(data.date, 'MMMM do, yyyy')}</span>
                           </div>
                           <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3 py-1">{data.shiftType}</Badge>
                        </div>
                    </div>

                    {/* Branding Footer */}
                    <div className="px-10 py-10 bg-black/40 border-t border-white/5 text-center flex items-center justify-center gap-3">
                        <div className="h-0.5 w-8 bg-zinc-800 rounded-full" />
                        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.6em]">Pool Party</span>
                        <div className="h-0.5 w-8 bg-zinc-800 rounded-full" />
                    </div>
                </Card>
            </motion.div>

            {/* Sticky Actions Container - Simplified for mobile scrolling */}
            <div className="w-full max-w-[360px] space-y-4 pb-12">
                <Button 
                    className="w-full py-6 text-xl rounded-2xl flex items-center justify-center gap-4 shadow-3xl shadow-primary/30 font-outfit font-black"
                    onClick={() => {
                        toast.success("Shift Record Saved to Photos! 📸")
                    }}
                >
                    <Download className="w-7 h-7" />
                    Save to Photos
                </Button>
                <button 
                    onClick={onClose}
                    className="w-full py-4 text-[11px] font-black uppercase tracking-[0.5em] text-zinc-600 hover:text-white transition-all bg-white/5 rounded-2xl active:scale-95"
                >
                    Back to Dashboard
                </button>
            </div>

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
