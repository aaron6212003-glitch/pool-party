import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const giphyKeys = [
        process.env.GIPHY_API_KEY,
        '3yH0OiuCH0ovdvyQgvzNIzZ1aihFNRKB', // User provided key
        'L849pue6AtTxP65yS3S9P3G5WX69iBBN',
        'dc6zaTOxFJmzC'
    ].filter(Boolean) as string[]
    const tenorKey = process.env.TENOR_API_KEY || 'LIVDSRZULEUB'

    let results: any[] = []
    let success = false

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    // 1. Try GIPHY
    for (const key of giphyKeys) {
        try {
            const url = query
                ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=50&rating=pg`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=50&rating=pg`

            const res = await fetch(url, { headers })
            if (!res.ok) {
                console.error(`Giphy ${key} failed with status: ${res.status}`)
                continue
            }
            const json = await res.json()

            if (json.data && json.data.length > 0) {
                results = json.data.map((gif: any) => ({
                    id: gif.id,
                    url: gif.images.fixed_height.url,
                    title: gif.title
                }))
                success = true
                break
            }
        } catch (e) {
            console.error('Giphy API Error:', e)
        }
    }

    // 2. Try TENOR fallback
    if (!success) {
        try {
            const url = query
                ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${tenorKey}&client_key=percoco_pool&limit=50`
                : `https://tenor.googleapis.com/v2/featured?key=${tenorKey}&client_key=percoco_pool&limit=50`

            const res = await fetch(url, { headers })
            if (res.ok) {
                const json = await res.json()
                if (json.results && json.results.length > 0) {
                    results = json.results.map((gif: any) => ({
                        id: gif.id,
                        url: gif.media_formats.tinygif.url,
                        title: gif.content_description
                    }))
                    success = true
                }
            } else {
                console.error(`Tenor failed with status: ${res.status}`)
            }
        } catch (e) {
            console.error('Tenor API Error:', e)
        }
    }

    return NextResponse.json({ success, results })
}
