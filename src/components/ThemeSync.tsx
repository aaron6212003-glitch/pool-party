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
                const theme = profile.theme
                if (theme.startsWith('#')) {
                    document.documentElement.style.setProperty('--primary', theme)
                    document.documentElement.removeAttribute('data-theme')
                } else {
                    document.documentElement.setAttribute('data-theme', theme)
                    document.documentElement.style.removeProperty('--primary')
                }
                localStorage.setItem('app-theme', theme)
            }
        }

        syncTheme()
    }, [supabase])

    return null
}
