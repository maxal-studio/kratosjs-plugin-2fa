import { authenticator } from 'otplib';
import QRCode from 'qrcode';

/**
 * Thin wrappers over otplib + qrcode so the rest of the plugin (and its tests) depend on a
 * small, stable surface rather than the libraries' full APIs.
 */

/** Generate a new base32 TOTP secret. */
export function generateSecret(): string {
	return authenticator.generateSecret();
}

/** Verify a user-entered 6-digit code against a stored secret. */
export function verifyToken(token: string, secret: string): boolean {
	try {
		return authenticator.verify({ token, secret });
	} catch {
		return false;
	}
}

/** Generate the current code for a secret (used in tests / debugging). */
export function generateToken(secret: string): string {
	return authenticator.generate(secret);
}

/** Build the `otpauth://` URL an authenticator app scans. */
export function buildOtpAuthUrl(accountName: string, issuer: string, secret: string): string {
	return authenticator.keyuri(accountName, issuer, secret);
}

/** Render an `otpauth://` URL to a PNG data URL for display. */
export async function buildQrDataUrl(otpauthUrl: string): Promise<string> {
	return QRCode.toDataURL(otpauthUrl);
}
