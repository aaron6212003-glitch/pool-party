"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'

export default function JoinGroupPage() {
    const params = useParams()
    const inviteCode = params?.inviteCode as string
    const router = useRouter()
    const supabase = createClient()
    const [status, setStatus] = useState('Checking your credentials...')

    useEffect(() => {
        if (!inviteCode || inviteCode === 'undefined') {
            toast.error("Invalid invite link format.")
            router.push('/app/groups')
            return
        }

        const joinGroup = async () => {
            try {
                // Safeguard against missing data object
                const { data, error: authError } = await supabase.auth.getUser()
                const user = data?.user

                if (!user) {
                    setStatus('Redirecting to login...')
                    // Safe localStorage for private browsers
                    try {
                        localStorage.setItem('pendingInviteCode', inviteCode)
                    } catch (e) {
                        console.warn("Storage blocked, invite might not persist after login.")
                    }
                    toast.info("Please sign in to join the party!")
                    router.push('/login')
                    return
                }

                setStatus(`Verifying invite code: ${inviteCode}`)

                // Check if group exists
                const { data: group, error: fetchError } = await supabase
                    .from('groups')
                    .select('*')
                    .eq('invite_code', inviteCode)
                    .single()

                if (fetchError || !group) {
                    toast.error("This party invite has expired or is invalid.")
                    router.push('/app/groups')
                    return
                }

                setStatus(`Welcome! Joining ${group.name}...`)

                // Join the group
                const { error: joinError } = await supabase.from('group_members').insert({
                    group_id: group.id,
                    user_id: user.id,
                    display_name: user.user_metadata?.full_name ?? 'Server',
                })

                if (joinError) {
                    if (joinError.code === '23505') {
                        toast.success(`You're already in ${group.name}!`)
                        router.push(`/app/groups/${group.id}`)
                        return
                    }
                    throw joinError
                }

                toast.success(`Welcome to the team! Joined ${group.name} 🥂`)
                router.push(`/app/groups/${group.id}`)
            } catch (error: any) {
                console.error("Join Error:", error)
                toast.error(error.message || "An error occurred while joining.")
                router.push('/app/groups')
            }
        }

        joinGroup()
    }, [inviteCode, router, supabase])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
            >
                <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-50 animate-pulse"></div>
                    <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] border border-white/5 flex items-center justify-center relative z-10 shadow-2xl">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black font-outfit text-white tracking-tighter">Establishing Connection.</h1>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">{status}</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-zinc-800 pt-10">
                    <Sparkles className="w-2.5 h-2.5" />
                    Pool Party
                </div>
            </motion.div>
        </div>
    )
}
