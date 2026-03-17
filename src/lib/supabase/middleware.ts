import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // PROTECTION: If there's a code, token, or session info in the URL, DO NOT call getUser().
    // Calling getUser() triggers a session exchange that consumes one-time codes.
    const url = new URL(request.url)
    const hasAuthParams = 
        url.searchParams.has('code') || 
        url.searchParams.has('token') || 
        url.searchParams.has('access_token') ||
        url.hash.includes('access_token') ||
        request.nextUrl.pathname.includes('reset-password') ||
        request.nextUrl.pathname.startsWith('/auth')

    if (hasAuthParams) {
        return supabaseResponse
    }

    // Check auth status
    const { data: { user } } = await supabase.auth.getUser()

    // PERSISTENCE LOGIC:
    // If user is at the root ("/") and is logged in, send them to the dashboard automatically
    if (user && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/app', request.url))
    }

    // PROTECTION LOGIC:
    // If user is NOT logged in and trying to access protected paths, send to login
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/app')
    if (!user && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
}
