import { definePluginClient } from '@maxal_studio/kratosjs-react';
import { TwoFactorChallenge } from './TwoFactorChallenge';
import TwoFactorSetupBlock from './TwoFactorSetupBlock';

/**
 * Client manifest for the 2FA plugin:
 * - `authChallenges['2fa-totp']` — the login challenge UI (matches the server challenge type).
 * - `blocks['two-factor-setup']` — the self-service settings page block (Security nav group).
 */
export default definePluginClient({
	name: '2fa',
	authChallenges: {
		'2fa-totp': TwoFactorChallenge,
	},
	blocks: {
		'two-factor-setup': TwoFactorSetupBlock,
	},
});

export { TwoFactorChallenge, TwoFactorSetupBlock };
