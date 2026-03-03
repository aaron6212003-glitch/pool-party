import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data: groups } = await supabaseAdmin.from('groups').select('id').limit(1);
    if (!groups || !groups.length) return console.log('no groups');
    const group_id = groups[0].id;
    
    console.log('Testing for group:', group_id);
    
    const { data: members, error: mErr } = await supabaseAdmin
        .from('group_members')
        .select('user_id, display_name, sling_user_id')
        .eq('group_id', group_id)
        .not('sling_user_id', 'is', null);

    console.log('Members with sling IDs:', members);

    for (const member of members) {
        const { data: pastShifts } = await supabaseAdmin
            .from('shift_entries')
            .select('net_sales, tips, computed_data')
            .eq('user_id', member.user_id)
            .order('date', { ascending: false })
            .limit(20);

        console.log(`Shifts for ${member.display_name}:`, pastShifts?.length);
        
        if (!pastShifts || pastShifts.length < 1) {
            console.log('Skipping due to < 1 shift');
            continue;
        }

        const avgSales = pastShifts.reduce((sum, s) => sum + parseFloat(s.net_sales || 0), 0) / pastShifts.length;
        const avgTips = pastShifts.reduce((sum, s) => sum + parseFloat(s.tips || 0) + parseFloat(s.computed_data?.cashTips || 0), 0) / pastShifts.length;
        
        const salesLine = Math.round(avgSales * 1.03 / 5) * 5;
        const tipsLine = Math.round(avgTips * 1.03 / 5) * 5;

        console.log(`Lines for ${member.display_name}: sales=${salesLine}, tips=${tipsLine}`);

        const { data: salesSlip, error: iErr1 } = await supabaseAdmin
            .from('slips')
            .upsert({
                group_id,
                target_user_id: member.user_id,
                shift_date: '2026-03-05',
                line_type: 'sales',
                line_value: salesLine,
                status: 'open'
            }, { onConflict: 'group_id,target_user_id,shift_date,line_type', ignoreDuplicates: true })
            .select()
            .single();

        console.log('Upsert sales:', salesSlip, iErr1);
    }
}
run().catch(console.error);
