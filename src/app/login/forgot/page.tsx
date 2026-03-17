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
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'request' | 'verify'>('request')
    const supabase = createClient()
    const router = useRouter()

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email)
            if (error) throw error
            setStep('verify')
            toast.success("Security code sent to your email!")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'recovery'
            })
            if (error) throw error
            
            // Success! Supabase has now authenticated this session.
            toast.success("Identity verified!")
            router.push('/login/reset-password')
        } catch (error: any) {
            toast.error("Invalid or expired code. Please check your email.")
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
                    onClick={() => step === 'verify' ? setStep('request') : router.push('/login')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-all mb-8"
                >
                    <ChevronLeft className="w-4 h-4" />
                    {step === 'verify' ? 'Back' : 'Back to Login'}
                </button>

                <div className="mb-10 text-center px-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2">Security</p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">
                        {step === 'request' ? 'Reset Password.' : 'Enter Code.'}
                    </h1>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">
                        {step === 'request' 
                            ? "We'll send a 6-digit verification code." 
                            : `We sent a code to ${email}`}
                    </p>
                </div>

                <Card className="!p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                    {step === 'request' ? (
                        <form onSubmit={handleRequestCode} className="space-y-6">
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
                                    {loading ? "Sending..." : "Get Reset Code"}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-6">
                            <Input
                                label="6-Digit Secret Code"
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                className="text-center text-2xl tracking-[0.5em] font-black"
                            />
                            <div className="pt-4">
                                <Button type="submit" className="w-full text-xl py-6 rounded-2xl shadow-primary/30" disabled={loading}>
                                    {loading ? "Verifying..." : "Verify Identity"}
                                </Button>
                                <button 
                                    type="button"
                                    onClick={handleRequestCode}
                                    className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400"
                                >
                                    Resend Code
                                </button>
                            </div>
                        </form>
                    )}
                </Card>
            </motion.div>
        </div>
    )
}
