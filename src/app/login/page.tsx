"use client"

import { useState } from 'react'
import { Card, Button, Input, SectionTitle } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, Sparkles } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                        data: {
                            full_name: displayName,
                        }
                    },
                })
                if (error) throw error

                if (data?.session) {
                    toast.success("Welcome to the team!")
                    checkInviteAndRedirect()
                } else {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    })
                    if (signInError) {
                        toast.success("Account created! Check your email.")
                    } else {
                        toast.success("Account created successfully!")
                        checkInviteAndRedirect()
                    }
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
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
                        🎉
                    </motion.div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2 opacity-80">Authentication</p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">
                        {isSignUp ? "Join the Party." : "Welcome Back."}
                    </h1>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">
                        {isSignUp ? "The pro tool for server teams" : "Ready to log your numbers?"}
                    </p>
                </div>

                <Card className="space-y-6 !p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                    <form onSubmit={handleAuth} className="space-y-6">
                        {isSignUp && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Input
                                    label="Display Name"
                                    placeholder="Nickname"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <Input
                            label="Email Address"
                            placeholder="name@restaurant.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Security Password"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {!isSignUp && (
                            <div className="flex justify-end -mt-2">
                                <button
                                    type="button"
                                    onClick={() => router.push('/login/forgot')}
                                    className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-primary transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button type="submit" className="w-full text-xl py-6 shadow-2xl shadow-primary/30 rounded-2xl" disabled={loading}>
                                {loading ? "One sec..." : (isSignUp ? "Create Account" : "Enter Dashboard")}
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="mt-12 text-center space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                        {isSignUp ? "Already a member?" : "New to the platform?"}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-primary hover:underline"
                        >
                            {isSignUp ? "Sign In" : "Register"}
                        </button>
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-zinc-800">
                        <Sparkles className="w-2.5 h-2.5" />
                        Pool Party OS v1.1
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
