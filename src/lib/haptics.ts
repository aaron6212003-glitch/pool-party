import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const hapticImpact = async (style: ImpactStyle = ImpactStyle.Light) => {
    try {
        await Haptics.impact({ style });
    } catch (e) {
        // Fallback or silent fail for web
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            const pattern = style === ImpactStyle.Heavy ? 20 : style === ImpactStyle.Medium ? 15 : 10;
            navigator.vibrate(pattern);
        }
    }
};

export const hapticNotification = async (type: NotificationType = NotificationType.Success) => {
    try {
        await Haptics.notification({ type });
    } catch (e) {
        // Fallback or silent fail for web
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            const pattern = type === NotificationType.Error ? [20, 50, 20] : 15;
            navigator.vibrate(pattern);
        }
    }
};

export const hapticSelection = async () => {
    try {
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
    } catch (e) {
        // No vibration for selection on web
    }
};
