"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ThemeSync() {
    const supabase = createClient()

    useEffect(() => {
        const syncTheme = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                // Try from localStorage as fallback for non-logged in users or fast load
                const saved = localStorage.getItem('app-theme')
                if (saved) document.documentElement.setAttribute('data-theme', saved)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('theme')
                .eq('id', user.id)
                .single()

            if (profile?.theme) {
                document.documentElement.setAttribute('data-theme', profile.theme)
                localStorage.setItem('app-theme', profile.theme)
            }
        }

        syncTheme()
    }, [supabase])

    return null
}
