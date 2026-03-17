import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/app'
    const origin = requestUrl.origin

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            // Check if 'next' is a relative path or a full URL
            const redirectUrl = next.startsWith('http') ? next : `${origin}${next}`
            return NextResponse.redirect(redirectUrl)
        }
        
        console.error('Auth callback error:', error)
    }

    // If no code or error during exchange, go to the error page we just created
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
