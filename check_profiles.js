const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://tvaydtxsajajgvxtojdh.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXlkdHhzYWphamd2eHRvamRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY0NTksImV4cCI6MjA4Nzk1MjQ1OX0.wqhSfKbvZAm_2CpHL30mZkeWye0x2Ril6yPuf-ZXuwc"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfile() {
    const { data: { users } } = await supabase.auth.admin.listUsers() // I don't have admin key usually, but let's try current user

    // Better: just check profiles table for all entries to see what's happening
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')

    if (error) {
        console.error('Error fetching profiles:', error)
        return
    }
    console.log('Profiles in DB:', JSON.stringify(profiles, null, 2))
}

checkProfile()
