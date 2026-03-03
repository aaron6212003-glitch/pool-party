"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function FixPage() {
    const [status, setStatus] = useState('Repairing session...')
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fix = async () => {
            try {
                // 1. Clear the oversized avatar_url from user_metadata
                const { error: updateErr } = await supabase.auth.updateUser({
                    data: { avatar_url: null }
                })

                if (updateErr) {
                    // If that fails too, force sign out so they get a clean session
                    setStatus('Session corrupt — signing out...')
                    await supabase.auth.signOut()
                    router.push('/login')
                    return
                }

                setStatus('Done! Redirecting...')
                // Give the session a moment to propagate
                setTimeout(() => router.push('/app/settings'), 1000)
            } catch {
                setStatus('Signing out to reset...')
                await supabase.auth.signOut()
                router.push('/login')
            }
        }

        fix()
    }, [])

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
            <p className="text-white font-bold text-sm">{status}</p>
        </div>
    )
}
