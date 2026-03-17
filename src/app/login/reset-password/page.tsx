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
    const [manualCode, setManualCode] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const checkExistingSession = async () => {
            // Check for code in URL first
            const url = new URL(window.location.href)
            const code = url.searchParams.get('code')
            
            if (code) {
                setManualCode(code)
                setChecking(false)
                return
            }

            // Fallback: check if the callback already logged us in
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setIsAuthed(true)
                setChecking(false)
            } else {
                setChecking(false) // Show "expired" screen if no session and no code
            }
        }
        checkExistingSession()
    }, [supabase, router])

    const handleClaimLink = async () => {
        if (!manualCode) return
        setLoading(true)
        try {
            const { error } = await supabase.auth.exchangeCodeForSession(manualCode)
            if (error) throw error
            setIsAuthed(true)
            toast.success("Identity verified!")
        } catch (error: any) {
            toast.error("This link has expired. Please request a new one.")
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

    if (!isAuthed && manualCode) {
        return (
            <div className="flex flex-col min-h-screen p-6 justify-center bg-black">
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm mx-auto z-10 text-center">
                    <div className="mb-10">
                        <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-8 text-4xl shadow-2xl">
                            🛡️
                        </div>
                        <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">Secure Link Ready.</h1>
                        <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60 px-8">Ready to reset your password? Click below to confirm your identity.</p>
                    </div>
                    <Card className="!p-10 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                        <Button onClick={handleClaimLink} className="w-full text-xl py-6 rounded-2xl" disabled={loading}>
                            {loading ? "Verifying..." : "Claim Recovery Link"}
                        </Button>
                    </Card>
                </motion.div>
            </div>
        )
    }

    if (!isAuthed) {
        // If we reach here without a session or a code, the link is truly dead
        router.push('/login/forgot')
        return null
    }

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
