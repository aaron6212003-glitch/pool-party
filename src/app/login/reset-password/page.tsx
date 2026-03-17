"use client"

import { useState, useEffect } from 'react'
import { Card, Button, Input } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Lock, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isAuthed, setIsAuthed] = useState(false)
    const [checking, setChecking] = useState(true)
    const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const checkLink = async () => {
            // 1. Check for 'code' in the URL (Modern flow)
            const searchParams = new URLSearchParams(window.location.search)
            const code = searchParams.get('code')
            
            // 2. Check for 'access_token' in the Hash (iPhone/Legacy flow)
            const hash = window.location.hash
            const hasTokenInHash = hash.includes('access_token=')

            if (code) {
                setRecoveryCode(code)
                setChecking(false)
                return
            }

            if (hasTokenInHash) {
                // If it's in the hash, Supabase client handles it automatically, 
                // but we need to verify we have a session now
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    setIsAuthed(true)
                }
                setChecking(false)
                return
            }

            // 3. Last resort: check if we are already authed
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setIsAuthed(true)
            }
            setChecking(false)
        }
        checkLink()
    }, [supabase])

    const handleClaimLink = async () => {
        if (!recoveryCode) return
        setLoading(true)
        try {
            const { error } = await supabase.auth.exchangeCodeForSession(recoveryCode)
            if (error) throw error
            setIsAuthed(true)
            toast.success("Identity verified! Reset your password now.")
        } catch (error: any) {
            console.error('Reset error:', error)
            toast.error("This specific link has expired. Please request a new one.")
            router.push('/login/forgot')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match.")
        }
        if (password.length < 6) {
            return toast.error("Password must be at least 6 characters.")
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            
            toast.success("Password updated successfully!")
            router.push('/app')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (checking) {
        return (
            <div className="flex flex-col min-h-screen p-6 justify-center bg-black items-center">
                 <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    // AUTHED: Show the New Password form
    if (isAuthed) {
        return (
            <div className="flex flex-col min-h-screen p-6 justify-center bg-black">
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm mx-auto z-10">
                    <div className="mb-10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2 opacity-80">Security Verified</p>
                        <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">New Password.</h1>
                        <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">Create a strong, secure password.</p>
                    </div>

                    <Card className="!p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <Input label="New Password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <Input label="Confirm Password" placeholder="••••••••" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            <div className="pt-4">
                                <Button type="submit" className="w-full text-xl py-6 rounded-2xl shadow-primary/30" disabled={loading}>
                                    {loading ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </motion.div>
            </div>
        )
    }

    // HAVE CODE BUT NOT EXCHANGED: Show the Claim button
    if (recoveryCode) {
        return (
            <div className="flex flex-col min-h-screen p-6 justify-center bg-black">
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm mx-auto z-10 text-center">
                    <div className="mb-10">
                        <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-8 text-4xl shadow-2xl">🛡️</div>
                        <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">Identity Check.</h1>
                        <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60 px-8">Tapping below verifies your device and unlocks the reset form.</p>
                    </div>
                    <Card className="!p-10 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                        <Button onClick={handleClaimLink} className="w-full text-xl py-6 rounded-2xl shadow-primary/20" disabled={loading}>
                            {loading ? "Verifying..." : "Unlock Reset Form"}
                        </Button>
                    </Card>
                </motion.div>
            </div>
        )
    }

    // FAILED: No session and no code
    return (
        <div className="flex flex-col min-h-screen p-6 justify-center bg-black">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm mx-auto text-center space-y-8">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 text-4xl">⚠️</div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black font-outfit text-white tracking-tight">Access Denied.</h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">The security link you clicked is missing or expired.</p>
                </div>
                <Button onClick={() => router.push('/login/forgot')} variant="secondary" className="w-full py-4 rounded-xl">Request New Link</Button>
            </motion.div>
        </div>
    )

    return (
        <div className="flex flex-col min-h-screen p-6 justify-center bg-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm mx-auto z-10"
            >
                <div className="mb-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2 opacity-80">Final Step</p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">
                        New Password.
                    </h1>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">
                        Create a strong, secure password.
                    </p>
                </div>

                <Card className="!p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <Input
                            label="New Password"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Input
                            label="Confirm Password"
                            placeholder="••••••••"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <div className="pt-4">
                            <Button type="submit" className="w-full text-xl py-6 shadow-2xl shadow-primary/30 rounded-2xl" disabled={loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}
