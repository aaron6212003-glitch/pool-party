const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tvaydtxsajajgvxtojdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXlkdHhzYWphamd2eHRvamRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY0NTksImV4cCI6MjA4Nzk1MjQ1OX0.wqhSfKbvZAm_2CpHL30mZkeWye0x2Ril6yPuf-ZXuwc'
const supabase = createClient(supabaseUrl, supabaseKey)

async function getTestData() {
    // Authenticate to bypass RLS for testing
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: 'percoco@pool.com',
        password: 'password'
    });

    if (loginError) {
        console.error("Login failed:", loginError);
        return;
    }

    console.log("Fetching all groups...")
    const { data: groups } = await supabase.from('groups').select('id, name')
    console.log("Groups:", groups)

    console.log("\nFetching all group members...")
    const { data: members } = await supabase.from('group_members').select('*')
    console.log("Members count:", members?.length)

    console.log("\nFetching all profiles...")
    const { data: profiles } = await supabase.from('profiles').select('*')
    console.log("Profiles count:", profiles?.length)

    if (members && profiles) {
        console.log("\n--- USER LIST ---")
        members.forEach(m => {
            const profile = profiles.find(p => p.id === m.user_id)
            const name = m.display_name || profile?.full_name || 'Anonymous'
            // In many schemas, email is only in auth.users, but let's see what profiles has
            const email = profile?.email || m.email || "Email hidden in Auth"
            console.log(`- ${name} (Email: ${email})`)
        })
    }
}

getTestData().catch(console.error)
