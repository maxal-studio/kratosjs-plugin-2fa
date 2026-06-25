import { Block, SerializedBlock } from '@maxal_studio/kratosjs';

export interface SerializedTwoFactorSetupBlock extends SerializedBlock {
	type: 'two-factor-setup';
}

/**
 * Custom page block that renders the self-service 2FA enrollment UI (QR + enable/disable).
 */
export class TwoFactorSetupBlock extends Block {
	protected blockType = 'two-factor-setup' as const;

	static make(): TwoFactorSetupBlock {
		return new TwoFactorSetupBlock();
	}

	toJSON(): SerializedTwoFactorSetupBlock {
		return {
			type: 'two-factor-setup',
			...(this._title !== undefined && { title: this._title }),
			...(this._subtitle !== undefined && { subtitle: this._subtitle }),
			...(this._columns !== undefined && { columns: this._columns }),
		};
	}
}
