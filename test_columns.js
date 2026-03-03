import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvaydtxsajajgvxtojdh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXlkdHhzYWphamd2eHRvamRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY0NTksImV4cCI6MjA4Nzk1MjQ1OX0.wqhSfKbvZAm_2CpHL30mZkeWye0x2Ril6yPuf-ZXuwc'
const supabase = createClient(supabaseUrl, supabaseKey)

async function t() {
    await supabase.auth.signInWithPassword({
        email: 'percoco@pool.com',
        password: 'password'
    })

    const { data: cols } = await supabase.from('profiles').select('id,avatar_url').limit(1)
    console.log(cols)
    
    // Oh actually we can just select all on group_members
    const { data: cols2 } = await supabase.from('group_members').select('*').limit(1)
    console.log("Cols members:", cols2 && cols2.length ? Object.keys(cols2[0]) : "No data")

    // Get table info using postgrest directly
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
        }
    })
    console.log("Profile keys from fetch:", Object.keys((await res.json())[0] || {}))
}
t()
