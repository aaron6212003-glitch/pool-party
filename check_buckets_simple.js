const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://tvaydtxsajajgvxtojdh.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXlkdHhzYWphamd2eHRvamRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY0NTksImV4cCI6MjA4Nzk1MjQ1OX0.wqhSfKbvZAm_2CpHL30mZkeWye0x2Ril6yPuf-ZXuwc"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBuckets() {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
        console.error('Error listing buckets:', error)
        return
    }
    console.log('Buckets:', JSON.stringify(data, null, 2))
}

checkBuckets()
