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
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const handleAuth = async () => {
            // Check for code in URL (standard PKCE flow)
            const url = new URL(window.location.href)
            const code = url.searchParams.get('code')
            
            // Handle Supabase error params in the URL
            const error = url.searchParams.get('error')
            const errorDescription = url.searchParams.get('error_description')

            if (error) {
                console.error('Auth error param:', error, errorDescription)
                toast.error(errorDescription || "Security link failed.")
                router.push('/login/forgot')
                return
            }
            
            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                if (exchangeError) {
                    console.error('Exchange error:', exchangeError)
                    toast.error("Recovery link failed. It may have expired.")
                    router.push('/login/forgot')
                    return
                }
                setIsAuthed(true)
                setChecking(false)
                return
            }

            // Fallback: check for existing session
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setIsAuthed(true)
                setChecking(false)
            } else {
                toast.error("Security link expired or invalid.")
                router.push('/login/forgot')
            }
        }
        handleAuth()
    }, [supabase, router])

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
                 <p className="mt-4 text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-none">Validating link...</p>
            </div>
        )
    }

    if (!isAuthed) return null

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
