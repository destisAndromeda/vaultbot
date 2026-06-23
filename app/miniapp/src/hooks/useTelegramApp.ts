// import { retrieveLaunchParams } from '@telegram-apps/sdk';

export function useTelegramApp() {
    const params = new URLSearchParams(window.location.search);
    return {
        action: params.get('action'),
        amount: params.get('amount'),
        userId: params.get('userId'),
    };
}