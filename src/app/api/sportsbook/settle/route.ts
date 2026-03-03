import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get recent logged shifts for this user. 
        // We'll look for shifts from the last 2 days that have OPEN slips awaiting settlement.

        // Find unsettled slips targeting this user
        const { data: slips } = await supabase
            .from('slips')
            .select('id, group_id, shift_date, line_type, line_value, status')
            .eq('target_user_id', user.id)
            .eq('status', 'open')

        if (!slips || slips.length === 0) {
            return NextResponse.json({ message: 'No slips to settle', settled: 0 })
        }

        let settledCount = 0

        for (const slip of slips) {
            // Find a shift logged by this user for the slip's date
            const { data: shiftData } = await supabase
                .from('shift_entries')
                .select('net_sales, tips, computed_data')
                .eq('user_id', user.id)
                .eq('date', slip.shift_date)
                .single()

            if (!shiftData) continue // No shift logged yet for this date

            // Calculate actuals
            const actualSales = parseFloat(shiftData.net_sales || 0)
            const actualTips = parseFloat(shiftData.tips || 0) + parseFloat(shiftData.computed_data?.cashTips || 0)

            const actualValue = slip.line_type === 'sales' ? actualSales : actualTips

            // Winning prediction
            const winningPrediction = actualValue >= slip.line_value ? 'over' : 'under'

            // Mark the slip as evaluated
            const { error: slipErr } = await supabase
                .from('slips')
                .update({ status: 'evaluated' })
                .eq('id', slip.id)

            if (slipErr) {
                console.error('Settle slip err:', slipErr)
                continue
            }

            // Find all pending wagers on this slip
            const { data: wagers } = await supabase
                .from('wagers')
                .select('id, user_id, prediction, amount')
                .eq('slip_id', slip.id)
                .eq('status', 'pending')

            if (wagers) {
                for (const wager of wagers) {
                    const won = wager.prediction === winningPrediction
                    const status = won ? 'won' : 'lost'

                    // Update wager status
                    await supabase
                        .from('wagers')
                        .update({ status })
                        .eq('id', wager.id)

                    // If they won, pay out (x2 for simple odds: 10 in -> 20 out)
                    if (won) {
                        // We need the user's bankroll for this group to update it
                        const { data: bankroll } = await supabase
                            .from('bankrolls')
                            .select('id, chips')
                            .eq('user_id', wager.user_id)
                            .eq('group_id', slip.group_id)
                            .single()

                        if (bankroll) {
                            await supabase
                                .from('bankrolls')
                                .update({ chips: bankroll.chips + (wager.amount * 2) })
                                .eq('id', bankroll.id)
                        }
                    }
                }
            }
            settledCount++
        }

        return NextResponse.json({ message: 'Slips evaluated', settled: settledCount })
    } catch (err: any) {
        console.error('settle-bets error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
