import { sanitizeReturnTo } from './oauth-flow';

export function resolveLoginReturnTo(rawReturnTo: string | null | undefined): string {
    return sanitizeReturnTo(rawReturnTo, '/dashboard');
}
