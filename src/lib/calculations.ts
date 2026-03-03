/**
 * Percoco Pool - Calculation Engine
 */

export interface TipoutRule {
    id: string;
    name: string;
    type: 'percentOfSales' | 'percentOfTips' | 'flat';
    value: number;
}

export interface ShiftNumbers {
    netSales: number;
    tips?: number;
    hours?: number;
}

export function calculateSupportPool(netSales: number, pct: number = 0.05): number {
    return parseFloat((netSales * pct).toFixed(2));
}

export function calculateTipouts(numbers: ShiftNumbers, rules: TipoutRule[]) {
    return rules.map(rule => {
        let amount = 0;
        if (rule.type === 'percentOfSales') {
            amount = numbers.netSales * (rule.value / 100);
        } else if (rule.type === 'percentOfTips' && numbers.tips) {
            amount = numbers.tips * (rule.value / 100);
        } else if (rule.type === 'flat') {
            amount = rule.value;
        }
        return {
            name: rule.name,
            amount: parseFloat(amount.toFixed(2))
        };
    });
}

export function calculateShiftGrade(netSales: number, totalTips: number): { grade: string, color: string } {
    if (!netSales || netSales === 0) return { grade: '-', color: 'text-zinc-500' }

    const pct = (totalTips / netSales) * 100

    if (pct >= 25) return { grade: 'A+', color: 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]' }
    if (pct >= 22) return { grade: 'A', color: 'text-emerald-400' }
    if (pct >= 20) return { grade: 'A-', color: 'text-emerald-500' }
    if (pct >= 18) return { grade: 'B+', color: 'text-lime-400' }
    if (pct >= 16) return { grade: 'B', color: 'text-yellow-400' }
    if (pct >= 14) return { grade: 'C+', color: 'text-amber-500' }
    if (pct >= 12) return { grade: 'C', color: 'text-orange-500' }
    if (pct >= 10) return { grade: 'D', color: 'text-red-400' }
    return { grade: 'F', color: 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' }
}
