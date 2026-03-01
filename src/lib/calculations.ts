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
