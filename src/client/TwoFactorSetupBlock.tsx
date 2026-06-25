import React, { useEffect, useState } from 'react';
import {
	authenticatedFetch,
	Button,
	Card,
	ErrorAlert,
	Icon,
	Input,
	Label,
	Spinner,
	useToast,
	useTranslation,
	translate,
	type CustomBlockComponentProps,
} from '@maxal_studio/kratosjs-react';

interface SetupData {
	secret: string;
	otpauthUrl: string;
	qrDataUrl: string;
}

async function postJson(url: string, apiBaseUrl: string, body: unknown) {
	const res = await authenticatedFetch(
		url,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body ?? {}),
		},
		apiBaseUrl,
	);
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(data.error || data.message || translate('2fa:setup.request_failed'));
	}
	return data;
}

/**
 * Self-service 2FA settings block. Lets the signed-in user enroll (scan a QR + confirm a
 * code), see that 2FA is active, and disable it (with a current code). Calls the plugin's
 * authenticated `/auth/2fa/*` routes.
 */
export default function TwoFactorSetupBlock({ apiBaseUrl }: CustomBlockComponentProps) {
	const base = apiBaseUrl ?? '';
	const toast = useToast();
	const { t } = useTranslation();

	const [loading, setLoading] = useState(true);
	const [enabled, setEnabled] = useState(false);
	const [setup, setSetup] = useState<SetupData | null>(null);
	const [code, setCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await authenticatedFetch(`${base}/auth/2fa/status`, {}, base);
				const data = await res.json();
				if (!cancelled) setEnabled(!!data.enabled);
			} catch {
				if (!cancelled) setError(t('2fa:setup.status_failed'));
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [base]);

	const onCodeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		setCode(e.target.value.replace(/\D/g, '').slice(0, 6));

	const startSetup = async () => {
		setBusy(true);
		setError(null);
		try {
			const data = (await postJson(`${base}/auth/2fa/setup`, base, {})) as SetupData;
			setSetup(data);
			setCode('');
		} catch (err: any) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	};

	const enable = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			await postJson(`${base}/auth/2fa/enable`, base, { code: code.trim() });
			setEnabled(true);
			setSetup(null);
			setCode('');
			toast.success(t('2fa:setup.enabled_toast'));
		} catch (err: any) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	};

	const disable = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			await postJson(`${base}/auth/2fa/disable`, base, { code: code.trim() });
			setEnabled(false);
			setCode('');
			toast.success(t('2fa:setup.disabled_toast'));
		} catch (err: any) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-xl py-2">
			<Card>
				<div className="mb-6 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft">
						<Icon name="ShieldCheck" className="h-5 w-5 text-accent" />
					</div>
					<div>
						<h2 className="text-lg font-semibold text-fg">{t('2fa:setup.heading')}</h2>
						<p className="text-sm text-fg-secondary">{t('2fa:setup.subtitle')}</p>
					</div>
				</div>

				{error && <ErrorAlert message={error} className="mb-4" onDismiss={() => setError(null)} />}

				{/* Enabled state — offer to disable */}
				{enabled && !setup && (
					<form onSubmit={disable} className="space-y-4">
						<div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
							<Icon name="CircleCheck" className="h-5 w-5 text-success" />
							<span className="text-sm font-medium text-fg">{t('2fa:setup.active')}</span>
						</div>
						<div className="space-y-2">
							<Label htmlFor="disable-code" required>
								{t('2fa:setup.disable_label')}
							</Label>
							<Input
								id="disable-code"
								inputMode="numeric"
								autoComplete="one-time-code"
								placeholder="123456"
								value={code}
								onChange={onCodeChange}
							/>
						</div>
						<Button type="submit" variant="danger" loading={busy} disabled={code.length < 6}>
							{t('2fa:setup.disable_button')}
						</Button>
					</form>
				)}

				{/* Setup in progress — show QR + confirm code */}
				{setup && (
					<form onSubmit={enable} className="space-y-5">
						<ol className="list-decimal space-y-1 pl-5 text-sm text-fg-secondary">
							<li>{t('2fa:setup.step_scan')}</li>
							<li>{t('2fa:setup.step_enter')}</li>
						</ol>

						<div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-base p-4">
							<img src={setup.qrDataUrl} alt={t('2fa:setup.qr_alt')} className="h-44 w-44" />
							<div className="text-center">
								<p className="text-xs text-fg-muted">{t('2fa:setup.manual_key')}</p>
								<code className="text-xs font-medium tracking-wider text-fg">{setup.secret}</code>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="enable-code" required>
								{t('2fa:setup.verify_label')}
							</Label>
							<Input
								id="enable-code"
								inputMode="numeric"
								autoComplete="one-time-code"
								placeholder="123456"
								autoFocus
								value={code}
								onChange={onCodeChange}
							/>
						</div>

						<div className="flex gap-2">
							<Button type="submit" loading={busy} disabled={code.length < 6}>
								{t('2fa:setup.enable_button')}
							</Button>
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setSetup(null);
									setCode('');
									setError(null);
								}}>
								{t('2fa:setup.cancel')}
							</Button>
						</div>
					</form>
				)}

				{/* Not enabled, not setting up — invite to enroll */}
				{!enabled && !setup && (
					<div className="space-y-4">
						<p className="text-sm text-fg-secondary">{t('2fa:setup.not_set_up')}</p>
						<Button
							onClick={startSetup}
							loading={busy}
							icon={<Icon name="ShieldCheck" className="h-4 w-4" />}>
							{t('2fa:setup.start_button')}
						</Button>
					</div>
				)}
			</Card>
		</div>
	);
}
