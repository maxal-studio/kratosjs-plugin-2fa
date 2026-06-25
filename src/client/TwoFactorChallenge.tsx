import React, { useState } from 'react';
import {
	Button,
	Input,
	Label,
	ErrorAlert,
	useTranslation,
	type AuthChallengeProps,
} from '@maxal_studio/kratosjs-react';

/**
 * Login challenge UI for TOTP 2FA. Rendered by the host LoginPage when the server returns a
 * `2fa-totp` challenge. Submits `{ code }` back to `/auth/challenge` via `onSubmit`.
 */
export function TwoFactorChallenge({ onSubmit, onCancel, error, submitting }: AuthChallengeProps) {
	const { t } = useTranslation();
	const [code, setCode] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		void onSubmit({ code: code.trim() });
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			{error && <ErrorAlert message={error} className="mb-2" />}

			<div className="space-y-2">
				<Label htmlFor="totp-code" required>
					{t('2fa:challenge.code_label')}
				</Label>
				<Input
					id="totp-code"
					inputMode="numeric"
					autoComplete="one-time-code"
					pattern="[0-9]*"
					maxLength={6}
					placeholder="123456"
					autoFocus
					value={code}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
					}
				/>
				<p className="text-xs text-fg-muted">{t('2fa:challenge.hint')}</p>
			</div>

			<Button type="submit" loading={submitting} disabled={code.length < 6} className="w-full h-11">
				{t('2fa:challenge.verify')}
			</Button>

			<Button type="button" variant="ghost" size="sm" onClick={onCancel} className="w-full">
				{t('2fa:challenge.back')}
			</Button>
		</form>
	);
}
