import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvaydtxsajajgvxtojdh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXlkdHhzYWphamd2eHRvamRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY0NTksImV4cCI6MjA4Nzk1MjQ1OX0.wqhSfKbvZAm_2CpHL30mZkeWye0x2Ril6yPuf-ZXuwc'
const supabase = createClient(supabaseUrl, supabaseKey)

async function sync() {
    await supabase.auth.signInWithPassword({
        email: 'percoco@pool.com',
        password: 'password'
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const full_name = user.user_metadata?.full_name;
        const avatar_url = user.user_metadata?.avatar_url;
        console.log("Syncing for", user.id, full_name, avatar_url ? "has avatar" : "no avatar");

        if (full_name) {
            await supabase.from('group_members').update({ display_name: full_name }).eq('user_id', user.id);
        }
        if (avatar_url) {
            await supabase.from('profiles').upsert({ id: user.id, avatar_url: avatar_url });
        }
    }
}
sync().then(() => console.log("Done syncing"));
