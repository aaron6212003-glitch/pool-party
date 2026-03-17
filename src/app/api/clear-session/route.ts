import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
    const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'https://percoco-pool.vercel.app'))

    // Clear ALL possible Supabase auth cookie names (they vary by project ref)
    const cookieNames = [
        'sb-tvaydtxsajajgvxtojdh-auth-token',
        'sb-tvaydtxsajajgvxtojdh-auth-token.0',
        'sb-tvaydtxsajajgvxtojdh-auth-token.1',
        'sb-tvaydtxsajajgvxtojdh-auth-token.2',
        'sb-access-token',
        'sb-refresh-token',
    ]

    const expiredCookieOptions = {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
    }

    for (const name of cookieNames) {
        response.cookies.set(name, '', expiredCookieOptions)
    }

    return response
}
