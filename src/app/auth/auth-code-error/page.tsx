"use client"

import { Card, Button } from '@/components/PercocoUI'
import { AlertCircle, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function AuthCodeError() {
    const router = useRouter()

    return (
        <div className="flex flex-col min-h-screen p-6 justify-center bg-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm mx-auto z-10"
            >
                <div className="mb-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 mb-2">Auth Error</p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">
                        Link Expired.
                    </h1>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">
                        This recovery link is no longer valid or has already been used.
                    </p>
                </div>

                <Card className="!p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem] text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">
                        Security links expire after a short time. Please request a new one from the login screen.
                    </p>
                    <Button 
                        onClick={() => router.push('/login/forgot')}
                        className="w-full py-4 rounded-xl"
                    >
                        Try Again
                    </Button>
                </Card>

                <button 
                    onClick={() => router.push('/login')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-all mt-8 mx-auto"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Login
                </button>
            </motion.div>
        </div>
    )
}
