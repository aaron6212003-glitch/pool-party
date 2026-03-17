import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/app'
    const origin = requestUrl.origin

    if (code) {
        // PASSIVE PASS: Do NOT exchange the code here. 
        // Pass it to the next page so the CLIENT can exchange it.
        // This is 100% safe from email scanner pre-fetching.
        const separator = next.includes('?') ? '&' : '?'
        return NextResponse.redirect(`${origin}${next}${separator}code=${code}`)
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
