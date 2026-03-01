import { calculateSupportPool, calculateTipouts, TipoutRule } from '../calculations';

describe('Shift Calculations', () => {
    test('calculates 5% support pool correctly', () => {
        expect(calculateSupportPool(100.00)).toBe(5.00);
        expect(calculateSupportPool(850.25)).toBe(42.51);
        expect(calculateSupportPool(0)).toBe(0);
    });

    test('calculates custom tipouts correctly', () => {
        const rules: TipoutRule[] = [
            { id: '1', name: 'Bartender', type: 'percentOfSales', value: 1.0 }, // 1%
            { id: '2', name: 'Host', type: 'flat', value: 10.0 }
        ];

        const results = calculateTipouts({ netSales: 1000 }, rules);
        expect(results[0].amount).toBe(10.00);
        expect(results[1].amount).toBe(10.00);
    });
});
