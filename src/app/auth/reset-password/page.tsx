"use client"

import { useState, useEffect } from 'react'
import { Card, Button, Input } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Ensure the user has a session (recovery links establish one)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error("Invalid or expired reset link.")
                router.push('/login')
            }
        }
        checkSession()
    }, [supabase, router])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (password !== confirmPassword) {
            toast.error("Passwords do not match.")
            return
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.")
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })
            
            if (error) throw error
            
            toast.success("Security updated! Use your new password to sign in.")
            router.push('/app')
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
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm mx-auto z-10"
            >
                <div className="mb-10 text-center">
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white font-bold mx-auto mb-8 text-4xl shadow-2xl shadow-primary/40 ring-4 ring-primary/10"
                    >
                        🔐
                    </motion.div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2 opacity-80">Security Update</p>
                    <h1 className="text-4xl font-black font-outfit text-white tracking-tighter leading-tight">
                        Reset Password.
                    </h1>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">
                        Create a strong new security key
                    </p>
                </div>

                <Card className="space-y-6 !p-10 shadow-3xl border-white/5 bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem]">
                    <form onSubmit={handleReset} className="space-y-6">
                        <Input
                            label="New Password"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            placeholder="••••••••"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <div className="pt-4">
                            <Button type="submit" className="w-full text-xl py-6 shadow-2xl shadow-primary/30 rounded-2xl" disabled={loading}>
                                {loading ? "Updating..." : "Secure Account"}
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="mt-12 text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-zinc-800">
                        <Sparkles className="w-2.5 h-2.5" />
                        Pool Party OS v1.1
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
