"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button } from '@/components/PercocoUI'
import { toast } from 'sonner'
import { Download, CheckCircle2, DollarSign, Clock, TrendingUp, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

interface ShiftWrapProps {
    data: {
        totalEarned: number;
        tipsPerHour: number;
        netSales: number;
        hours: number;
        date: Date;
        shiftType: string;
        isPR?: boolean;
    };
    onClose: () => void;
}

export default function ShiftWrap({ data, onClose }: ShiftWrapProps) {
    // Generate a premium card visual that feels like a "Receipt of Success"
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto"
        >
            {/* The "Receipt" Card */}
            <motion.div
                initial={{ scale: 0.9, y: 50, rotate: -2 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="w-full max-w-[340px] relative"
                id="shift-wrap-card"
            >
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-primary/20 blur-[100px] rounded-full opacity-50" />
                
                <Card className="!p-0 overflow-hidden bg-zinc-900/90 border-white/10 shadow-[0_0_80px_rgba(0,122,255,0.2)] rounded-[3.5rem] relative z-10 backdrop-blur-3xl">
                    {/* Header Header */}
                    <div className="bg-gradient-to-br from-primary via-primary to-indigo-600 p-10 text-center relative overflow-hidden">
                        <motion.div 
                            animate={{ 
                                rotate: [12, 11, 12],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute inset-0 opacity-20 flex items-center justify-center"
                        >
                            <Sparkles className="w-80 h-80 text-white" />
                        </motion.div>
                        
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/20"
                        >
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </motion.div>
                        
                        <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/70 mb-2 relative z-10 font-outfit">Shift Summary</h2>
                        <p className="text-4xl font-black text-white tracking-widest font-outfit relative z-10">WRAPPED.</p>
                    </div>

                    {/* Stats Body */}
                    <div className="p-10 space-y-12 bg-gradient-to-b from-transparent to-black/20">
                        {/* The Big Number */}
                        <div className="text-center space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Earnings Secured</p>
                            <h3 className="text-7xl font-black font-outfit text-white tracking-tighter leading-none mb-2">
                                ${data.totalEarned.toFixed(0)}
                            </h3>
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Personal Best Level</span>
                            </div>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                            <div className="bg-zinc-900/40 p-6 space-y-1.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-primary" /> Hourly
                                </p>
                                <p className="text-2xl font-black font-outfit text-white tracking-tight">${data.tipsPerHour.toFixed(0)}<span className="text-xs text-zinc-600">/hr</span></p>
                            </div>
                            <div className="bg-zinc-900/40 p-6 space-y-1.5 text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-1.5 justify-end">
                                    <DollarSign className="w-3 h-3 text-secondary" /> Volume
                                </p>
                                <p className="text-2xl font-black font-outfit text-white tracking-tight">${data.netSales.toFixed(0)}</p>
                            </div>
                        </div>

                        {/* Context Info */}
                        <div className="flex justify-between items-center px-2">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-700">Service Date</p>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{format(data.date, 'MMM do, yyyy')}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-700">Rotation</p>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{data.shiftType}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Branding */}
                    <div className="px-10 py-8 border-t border-white/5 bg-black/20 text-center">
                        <div className="flex items-center justify-center gap-3 grayscale opacity-40">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.8em] text-white">Pool Party</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Actions */}
            <div className="mt-12 w-full max-w-[340px] space-y-4">
                <Button 
                    className="w-full py-6 text-xl rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 backdrop-blur-md"
                    onClick={() => {
                        toast.success("Saved to Photos! 📸 (Simulated)")
                        // In a real app with Capacitor, we would use a screenshot plugin
                    }}
                >
                    <Download className="w-6 h-6" />
                    Save to Photos
                </Button>
                <button 
                    onClick={onClose}
                    className="w-full text-[11px] font-black uppercase tracking-[0.5em] text-zinc-600 hover:text-white transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </motion.div>
    )
}
