import { EntitySchema } from '@mikro-orm/core';
import { idProps, DriverKind } from '@maxal_studio/kratosjs';

/**
 * Side entity that stores a user's TOTP secret. Keyed by `userId` (unique) so the host
 * `User` entity is never modified — the same convention the permissions plugin uses for
 * its role relation.
 */
export interface IUserTwoFactor {
	id: number | string;
	/** Id of the user this secret belongs to (stringified host user id). */
	userId: string;
	/** Base32 TOTP shared secret. */
	secret: string;
	/** Whether 2FA enrollment has been confirmed and is enforced at login. */
	enabled: boolean;
	createdAt: Date;
}

/**
 * Build the UserTwoFactor entity for the active database driver.
 */
export function createUserTwoFactorEntity(driver: DriverKind): EntitySchema<IUserTwoFactor> {
	return new EntitySchema<IUserTwoFactor>({
		name: 'UserTwoFactor',
		properties: {
			...idProps(driver),
			userId: { type: 'string', unique: true },
			secret: { type: 'string' },
			enabled: { type: 'boolean', default: false },
			createdAt: { type: 'Date', onCreate: () => new Date() },
		} as any,
	});
}
