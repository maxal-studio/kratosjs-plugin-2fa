import {
  Plugin,
  Panel,
  AuthUser,
  AuthHookContext,
  KratosRequest,
  KratosReply,
  adminRoute,
  t,
} from "@maxal_studio/kratosjs";
import en from "./lang/en";
import sq from "./lang/sq";
import type { EntityManager, EntitySchema } from "@mikro-orm/core";
import {
  createUserTwoFactorEntity,
  type IUserTwoFactor,
} from "./entities/UserTwoFactor";
import { Migration20260101000000CreateUserTwoFactor } from "./migrations/sql/Migration20260101000000CreateUserTwoFactor";
import {
  generateSecret,
  verifyToken,
  buildOtpAuthUrl,
  buildQrDataUrl,
} from "./totp";
import { TwoFactorPage } from "./TwoFactorPage";

/** The challenge type this plugin registers. Must match the client `authChallenges` key. */
export const TWO_FACTOR_CHALLENGE_TYPE = "2fa-totp";

export interface TwoFactorPluginOptions {
  /** Issuer label shown in the authenticator app. Defaults to 'KratosJs'. */
  issuer?: string;
}

/**
 * TwoFactorPlugin — adds TOTP (Google Authenticator) 2FA to the login flow using only the
 * public auth-extension surface: it registers a single `AuthChallengeProvider` and a few
 * authenticated enrollment routes. Nothing in core knows about 2FA.
 *
 * The secret lives on a side entity (`UserTwoFactor`) keyed by userId; the host `User`
 * entity is never modified.
 */
export class TwoFactorPlugin extends Plugin {
  private readonly options: TwoFactorPluginOptions;
  private panel!: Panel;
  private entity!: EntitySchema<IUserTwoFactor>;

  constructor(options: TwoFactorPluginOptions = {}) {
    super();
    this.options = options;
  }

  getName(): string {
    return "2fa";
  }

  register(panel: Panel): void {
    this.panel = panel;
    panel.registerTranslations("2fa", { en, sq });

    const driver = panel.getDriverKind();
    this.entity = createUserTwoFactorEntity(driver);
    panel.registerEntities([this.entity]);
    if (driver === "sql") {
      panel.registerMigrations([Migration20260101000000CreateUserTwoFactor]);
    }

    // The universal extension point: pause login with a TOTP step when the user is enrolled.
    panel.registerAuthChallenge({
      type: TWO_FACTOR_CHALLENGE_TYPE,
      isRequired: async (user: AuthUser, ctx: AuthHookContext) => {
        const record = await this.findRecord(ctx.getEm(), user.id);
        return !!record && record.enabled === true;
      },
      verify: async (
        user: AuthUser,
        payload: unknown,
        ctx: AuthHookContext,
      ) => {
        const record = await this.findRecord(ctx.getEm(), user.id);
        if (!record || !record.enabled) {
          return false;
        }
        const code = (payload as { code?: unknown } | null)?.code;
        if (typeof code !== "string") {
          return false;
        }
        return verifyToken(code, record.secret);
      },
      // Nothing sensitive is sent to the client — the secret never leaves the server here.
      getChallengeData: () => ({}),
    });

    // Self-service settings page (navigation group "Security") + its custom block.
    panel.registerCustomBlock("two-factor-setup");
    panel.registerPage(TwoFactorPage);

    // Enrollment routes. `adminRoute` prepends the panel's base path and applies the
    // request-scoped ORM context AND the auth middleware, so these run only for an
    // authenticated user (available on `req.authUser`). It is required: without it
    // `route()` registers a bare, public, top-level path — these endpoints must never
    // be reachable unauthenticated.
    panel.route("get", "/auth/2fa/status", adminRoute(panel), (req, res) =>
      this.handleStatus(req, res),
    );
    panel.route("post", "/auth/2fa/setup", adminRoute(panel), (req, res) =>
      this.handleSetup(req, res),
    );
    panel.route("post", "/auth/2fa/enable", adminRoute(panel), (req, res) =>
      this.handleEnable(req, res),
    );
    panel.route("post", "/auth/2fa/disable", adminRoute(panel), (req, res) =>
      this.handleDisable(req, res),
    );
  }

  /**
   * GET /auth/2fa/status — whether the current user has 2FA enabled. Drives the settings UI.
   */
  private async handleStatus(
    req: KratosRequest,
    res: KratosReply,
  ): Promise<void> {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: t("2fa:error.auth_required") });
      return;
    }
    const record = await this.findRecord(this.panel.getEm(), user.id);
    res.json({ enabled: !!record && record.enabled === true });
  }

  private get issuer(): string {
    return this.options.issuer ?? "KratosJs";
  }

  private findRecord(
    em: EntityManager,
    userId: string,
  ): Promise<IUserTwoFactor | null> {
    return em.findOne(this.entity, {
      userId: String(userId),
    } as any) as Promise<IUserTwoFactor | null>;
  }

  /**
   * POST /auth/2fa/setup — generate a fresh (unconfirmed) secret and return the otpauth
   * URL + QR data URL so the user can add it to their authenticator app.
   */
  private async handleSetup(
    req: KratosRequest,
    res: KratosReply,
  ): Promise<void> {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: t("2fa:error.auth_required") });
      return;
    }

    const em = this.panel.getEm();
    const secret = generateSecret();

    let record = await this.findRecord(em, user.id);
    if (record) {
      // Re-enrolling: replace the secret and require confirmation again.
      record.secret = secret;
      record.enabled = false;
    } else {
      record = em.create(this.entity, {
        userId: String(user.id),
        secret,
        enabled: false,
      } as IUserTwoFactor);
      em.persist(record);
    }
    await em.flush();

    const otpauthUrl = buildOtpAuthUrl(user.email, this.issuer, secret);
    const qrDataUrl = await buildQrDataUrl(otpauthUrl);

    res.json({ secret, otpauthUrl, qrDataUrl });
  }

  /**
   * POST /auth/2fa/enable — confirm enrollment by verifying a code against the pending
   * secret, then enforce 2FA on subsequent logins.
   */
  private async handleEnable(
    req: KratosRequest,
    res: KratosReply,
  ): Promise<void> {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: t("2fa:error.auth_required") });
      return;
    }

    const code = (req.body as { code?: unknown })?.code;
    if (typeof code !== "string") {
      res.status(400).json({ error: t("2fa:error.code_required") });
      return;
    }

    const em = this.panel.getEm();
    const record = await this.findRecord(em, user.id);
    if (!record) {
      res.status(400).json({ error: t("2fa:error.run_setup") });
      return;
    }

    if (!verifyToken(code, record.secret)) {
      res.status(400).json({ error: t("2fa:error.invalid_code") });
      return;
    }

    record.enabled = true;
    await em.flush();
    res.json({ enabled: true });
  }

  /**
   * POST /auth/2fa/disable — verify a current code, then remove the secret.
   */
  private async handleDisable(
    req: KratosRequest,
    res: KratosReply,
  ): Promise<void> {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: t("2fa:error.auth_required") });
      return;
    }

    const code = (req.body as { code?: unknown })?.code;
    if (typeof code !== "string") {
      res.status(400).json({ error: t("2fa:error.code_required") });
      return;
    }

    const em = this.panel.getEm();
    const record = await this.findRecord(em, user.id);
    if (!record || !verifyToken(code, record.secret)) {
      res.status(400).json({ error: t("2fa:error.invalid_code") });
      return;
    }

    em.remove(record);
    await em.flush();
    res.json({ disabled: true });
  }
}
