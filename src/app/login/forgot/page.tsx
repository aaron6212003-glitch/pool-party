"use client"

import { useState } from 'react'
import { Card, Button, Input } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ChevronLeft, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login/reset-password`,
            })
            if (error) throw error
            setSent(true)
            toast.success("Recovery link sent!")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen p-6 justify-center bg-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm mx-auto z-10"
            >
                <button 
                    onClick={() => router.push('/login')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-all mb-8"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Login
                </button>

                <div className="mb-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2 opacity-80">Security</p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">
                        Reset Password.
                    </h1>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">
                        We'll send a recovery link to your email.
                    </p>
                </div>

                <Card className="!p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                    {sent ? (
                        <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in">
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-black font-outfit text-white tracking-tight">Check your inbox.</h2>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                                A reset link has been sent to <br/>
                                <span className="text-white">{email}</span>
                            </p>
                            <Button 
                                onClick={() => router.push('/login')}
                                variant="secondary"
                                className="w-full mt-6"
                            >
                                Back to Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <Input
                                label="Email Address"
                                placeholder="name@restaurant.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <div className="pt-4">
                                <Button type="submit" className="w-full text-xl py-6 shadow-2xl shadow-primary/30 rounded-2xl" disabled={loading}>
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </motion.div>
        </div>
    )
}
