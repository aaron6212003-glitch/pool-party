"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        supabase.auth.signOut().then(() => {
            router.push('/login')
        })
    }, [])

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
        </div>
    )
}
