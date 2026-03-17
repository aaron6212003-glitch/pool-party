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

    const handleRequestLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/login/reset-password`,
            })
            if (error) throw error
            setSent(true)
            toast.success("Recovery link sent to your email!")
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

                <div className="mb-10 text-center px-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2">Security</p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">
                        Reset Password.
                    </h1>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">
                        {sent ? "Check your inbox for the reset link." : "We'll send a secure recovery link to your email."}
                    </p>
                </div>

                <Card className="!p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                    {sent ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                                <Mail className="w-8 h-8" />
                            </div>
                            <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                We've sent a link to <span className="text-white font-bold">{email}</span>. Please click the link to continue.
                            </p>
                            <Button 
                                onClick={() => setSent(false)} 
                                variant="secondary"
                                className="w-full py-4 rounded-xl text-[10px]"
                            >
                                Re-enter Email
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleRequestLink} className="space-y-6">
                            <Input
                                label="Email Address"
                                placeholder="name@restaurant.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <div className="pt-4">
                                <Button type="submit" className="w-full text-xl py-6 rounded-2xl shadow-primary/30" disabled={loading}>
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
