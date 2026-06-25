import { Page, t } from '@maxal_studio/kratosjs';
import { TwoFactorSetupBlock } from './TwoFactorSetupBlock';

/**
 * Self-service 2FA settings page. Appears in the panel navigation under "Security" and lets
 * the signed-in user enroll, enable, or disable their own two-factor authentication.
 */
export class TwoFactorPage extends Page {
	static slug = '2fa';
	// Static labels via getters so they re-resolve per request (active locale).
	static get label() {
		return t('2fa:page.label');
	}
	static icon = 'ShieldCheck';
	static get navigationGroup() {
		return t('2fa:navGroup');
	}
	static navigationSort = 100;

	static async blocks() {
		return [TwoFactorSetupBlock.make().columns(12)];
	}
}
