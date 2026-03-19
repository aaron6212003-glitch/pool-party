"use client"

import { useState, Suspense } from 'react'
import { Card, Button, Input } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, Sparkles, Loader2 } from 'lucide-react'

function LoginContent() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [resetSent, setResetSent] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    
    const nextPath = searchParams.get('next')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
                })
                if (error) throw error
                setResetSent(true)
                toast.success("Reset link sent! Check your inbox.")
            } else if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`,
                        data: {
                            full_name: displayName,
                        }
                    },
                })
                
                if (error) {
                    if (error.message.includes("User already registered")) {
                        toast.error("Account already exists. Try signing in!")
                        setIsSignUp(false)
                        return
                    }
                    throw error
                }

                if (data?.session) {
                    toast.success("Welcome to the team!")
                    checkInviteAndRedirect()
                } else {
                    toast.success("Verification required! Please check your email and click the confirmation link.")
                    setIsSignUp(false)
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) {
                    if (error.message.includes("Email not confirmed")) {
                        toast.error("Please verify your email before signing in.")
                        return
                    }
                    throw error
                }
                checkInviteAndRedirect()
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const checkInviteAndRedirect = () => {
        try {
            // Priority 1: URL param 'next'
            if (nextPath && nextPath.startsWith('/join/')) {
                router.push(nextPath)
                return
            }

            // Priority 2: localStorage (fallback for after email confirmation)
            const pendingInvite = localStorage.getItem('pendingInviteCode')
            if (pendingInvite) {
                localStorage.removeItem('pendingInviteCode')
                router.push(`/join/${pendingInvite}`)
                return
            }
        } catch (e) {
            console.error("Storage error during redirect", e)
        }
        router.push('/app')
        router.refresh()
    }

    return (
        <div className="flex flex-col min-h-screen p-6 justify-center bg-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm mx-auto z-10"
            >
                <div className="mb-10 text-center">
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white font-bold mx-auto mb-8 text-4xl shadow-2xl shadow-primary/40 ring-4 ring-primary/10"
                    >
                        {isForgotPassword ? "🔒" : "🎉"}
                    </motion.div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2 opacity-80">
                        {isForgotPassword ? "Security" : "Authentication"}
                    </p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">
                        {isForgotPassword ? "Lost access?" : (isSignUp ? "Join the Party." : "Welcome Back.")}
                    </h1>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">
                        {isForgotPassword ? "Enter your email for a reset link" : (isSignUp ? "The pro tool for server teams" : "Ready to log your numbers?")}
                    </p>
                </div>

                <Card className="space-y-6 !p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                    <AnimatePresence mode="wait">
                        {resetSent ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-center space-y-4 py-4"
                            >
                                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h3 className="text-white font-black font-outfit text-xl">Check your inbox!</h3>
                                <p className="text-zinc-500 text-xs font-medium leading-relaxed">We've sent a magic link to {email} to get you back in. Wait a few minutes and check your spam too!</p>
                                <Button onClick={() => setResetSent(false)} className="bg-white/5 text-white w-full py-4 mt-4">Try another email</Button>
                            </motion.div>
                        ) : (
                            <motion.form 
                                key="login-form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleAuth} 
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    {isSignUp && (
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-1">Display Name</p>
                                            <Input
                                                placeholder="e.g. Server Sam"
                                                value={displayName}
                                                onChange={e => setDisplayName(e.target.value)}
                                                className="bg-black/40 border-white/5 h-14 rounded-2xl focus:border-primary/50 transition-colors"
                                                required
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-1">Email Address</p>
                                        <Input
                                            type="email"
                                            placeholder="server@restaurant.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="bg-black/40 border-white/5 h-14 rounded-2xl focus:border-primary/50 transition-colors"
                                            required
                                        />
                                    </div>
                                    {!isForgotPassword && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Password</p>
                                                {!isSignUp && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsForgotPassword(true)}
                                                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
                                                    >
                                                        Forgot?
                                                    </button>
                                                )}
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="bg-black/40 border-white/5 h-14 rounded-2xl focus:border-primary/50 transition-colors"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full h-16 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        <span className="flex items-center gap-2 justify-center">
                                            {isForgotPassword ? "Send Reset Link" : (isSignUp ? "Create Account" : "Access Hub")}
                                            <LogIn className="w-4 h-4" />
                                        </span>
                                    )}
                                </Button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </Card>

                <div className="mt-8 text-center space-x-2">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setIsForgotPassword(false)
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                    >
                        {isSignUp ? "Already a member? " : "New to the party? "}
                        <span className="text-primary">{isSignUp ? "Sign In" : "Register Now"}</span>
                    </button>
                    {isForgotPassword && (
                        <button
                            onClick={() => setIsForgotPassword(false)}
                            className="block mt-4 mx-auto text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                        >
                            Back to Login
                        </button>
                    )}
                </div>
                
                <div className="mt-12 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-zinc-800">
                    <Sparkles className="w-2.5 h-2.5" />
                    Pool Party OS v1.1
                </div>
            </motion.div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
