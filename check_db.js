import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvaydtxsajajgvxtojdh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXlkdHhzYWphamd2eHRvamRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY0NTksImV4cCI6MjA4Nzk1MjQ1OX0.wqhSfKbvZAm_2CpHL30mZkeWye0x2Ril6yPuf-ZXuwc'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1)
        if (error) {
            console.error("Error fetching profiles:", error)
            return
        }
        if (data && data.length > 0) {
            console.log("Profiles columns found:", Object.keys(data[0]))
        } else {
            console.log("No profiles found, but query succeeded.")
        }
    } catch (e) {
        console.error("Exec error:", e)
    }
}

checkColumns()
