import { describe, expect, it } from 'vitest';
import { authenticator } from 'otplib';
import { generateSecret, generateToken, verifyToken, buildOtpAuthUrl } from './totp';

// The challenge provider's verify() reduces to verifyToken(code, secret); these pin that.

describe('2FA TOTP helpers', () => {
	it('accepts a freshly generated code for its secret', () => {
		const secret = generateSecret();
		const code = generateToken(secret);
		expect(verifyToken(code, secret)).toBe(true);
	});

	it('rejects a wrong code', () => {
		const secret = generateSecret();
		expect(verifyToken('000000', secret)).toBe(false);
	});

	it('rejects a code generated for a different secret', () => {
		const secretA = generateSecret();
		const secretB = generateSecret();
		const codeForB = authenticator.generate(secretB);
		// Astronomically unlikely to collide; guards against a swapped-secret bug.
		expect(verifyToken(codeForB, secretA)).toBe(false);
	});

	it('builds an otpauth URL that embeds the secret and issuer', () => {
		const secret = generateSecret();
		const url = buildOtpAuthUrl('alice@example.com', 'KratosJs', secret);
		expect(url.startsWith('otpauth://totp/')).toBe(true);
		expect(url).toContain(`secret=${secret}`);
		expect(url).toContain('issuer=KratosJs');
	});
});
