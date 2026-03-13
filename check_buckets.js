const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBuckets() {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
        console.error('Error listing buckets:', error)
        return
    }
    console.log('Buckets:', data)
}

checkBuckets()
