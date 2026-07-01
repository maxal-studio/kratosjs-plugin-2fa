// Server catalog for the 2fa plugin. Namespace: `2fa`.
const en = {
	'page.label': '2 Factor Auth',
	navGroup: 'System',
	'error.auth_required': 'Authentication required',
	'error.code_required': 'A verification code is required',
	'error.run_setup': 'Run setup before enabling 2FA',
	'error.invalid_code': 'Invalid verification code',
	// Front end
	// Login challenge
	'challenge.code_label': 'Authentication code',
	'challenge.hint': 'Enter the 6-digit code from your authenticator app.',
	'challenge.verify': 'Verify',
	'challenge.back': 'Back to sign in',
	// Self-service setup block
	'setup.request_failed': 'Request failed',
	'setup.status_failed': 'Failed to load two-factor status',
	'setup.enabled_toast': 'Two-factor authentication enabled',
	'setup.disabled_toast': 'Two-factor authentication disabled',
	'setup.heading': 'Two-factor authentication',
	'setup.subtitle': 'Add a one-time code from an authenticator app to your sign-in.',
	'setup.active': 'Two-factor authentication is active on your account.',
	'setup.disable_label': 'Enter a current code to disable',
	'setup.disable_button': 'Disable two-factor',
	'setup.step_scan': 'Scan the QR code with Google Authenticator (or any TOTP app).',
	'setup.step_enter': 'Enter the 6-digit code it shows to confirm.',
	'setup.qr_alt': '2FA QR code',
	'setup.manual_key': 'Or enter this key manually:',
	'setup.verify_label': 'Verification code',
	'setup.enable_button': 'Enable two-factor',
	'setup.cancel': 'Cancel',
	'setup.not_set_up':
		'Two-factor authentication is not set up. When enabled, you will be asked for a code from your authenticator app each time you sign in.',
	'setup.start_button': 'Set up two-factor authentication',
};

export default en;
