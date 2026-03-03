import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvaydtxsajajgvxtojdh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXlkdHhzYWphamd2eHRvamRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY0NTksImV4cCI6MjA4Nzk1MjQ1OX0.wqhSfKbvZAm_2CpHL30mZkeWye0x2Ril6yPuf-ZXuwc'
const supabase = createClient(supabaseUrl, supabaseKey)

async function t() {
    await supabase.auth.signInWithPassword({
        email: 'percoco@pool.com',
        password: 'password'
    })

    const { data: cols } = await supabase.rpc('get_table_columns_by_name') || await supabase.from('profiles').select('*').limit(1)
    console.log("Profiles columns:", Object.keys(cols[0] || {}))
}
t()
