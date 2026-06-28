import { z } from "zod";

/**
 * Environment variable names follow the pattern: component__variable_name
 * (double underscore between segments, snake_case). See .env.example and
 * the plan for the full mapping from config paths to env keys.
 */

const envSchema = z.object({
  app__base_url: z.string().url().optional(),
  app__node_env: z.enum(["development", "production", "test"]).optional(),
  app__log_level: z.enum(["debug", "info", "warn", "error"]).optional(),
  app__service_name: z.string().optional(),
  nocodb__base_url: z.string().optional(),
  nocodb__api_token: z.string().optional(),
  nocodb__users__table_id: z.string().optional(),
  nocodb__users__view_id: z.string().optional(),
  nocodb__cms__table_id: z.string().optional(),
  nocodb__cms__view_id: z.string().optional(),
  nocodb__presigned_links__table_id: z.string().optional(),
  nocodb__presigned_links__view_id: z.string().optional(),
  nocodb__candidates__table_id: z.string().optional(),
  nocodb__candidates__view_id: z.string().optional(),
  nocodb__campaigns__table_id: z.string().optional(),
  nocodb__campaigns__view_id: z.string().optional(),
  nocodb__campaign_sends__table_id: z.string().optional(),
  nocodb__campaign_sends__view_id: z.string().optional(),
  features__whatsapp_link: z.string().optional(),
  features__geocodio_api_key: z.string().optional(),
  twilio__from_email: z.string().optional(),
  twilio__from_name: z.string().optional(),
  twilio__account_sid: z.string().optional(),
  twilio__auth_token: z.string().optional(),
  twilio__messaging_phone_number: z.string().optional(),
  campaigns__webhook_secret: z.string().optional(),
  unsubscribe__secret: z.string().optional(),
  org__postal_address: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse({
    app__base_url: process.env.app__base_url,
    app__node_env: process.env.app__node_env,
    app__log_level: process.env.app__log_level,
    app__service_name: process.env.app__service_name,
    nocodb__base_url: process.env.nocodb__base_url,
    nocodb__api_token: process.env.nocodb__api_token,
    nocodb__users__table_id: process.env.nocodb__users__table_id,
    nocodb__users__view_id: process.env.nocodb__users__view_id,
    nocodb__cms__table_id: process.env.nocodb__cms__table_id,
    nocodb__cms__view_id: process.env.nocodb__cms__view_id,
    nocodb__presigned_links__table_id:
      process.env.nocodb__presigned_links__table_id,
    nocodb__presigned_links__view_id:
      process.env.nocodb__presigned_links__view_id,
    nocodb__candidates__table_id: process.env.nocodb__candidates__table_id,
    nocodb__candidates__view_id: process.env.nocodb__candidates__view_id,
    nocodb__campaigns__table_id: process.env.nocodb__campaigns__table_id,
    nocodb__campaigns__view_id: process.env.nocodb__campaigns__view_id,
    nocodb__campaign_sends__table_id:
      process.env.nocodb__campaign_sends__table_id,
    nocodb__campaign_sends__view_id:
      process.env.nocodb__campaign_sends__view_id,
    features__whatsapp_link: process.env.features__whatsapp_link,
    features__geocodio_api_key: process.env.features__geocodio_api_key,
    twilio__from_email: process.env.twilio__from_email,
    twilio__from_name: process.env.twilio__from_name,
    twilio__account_sid: process.env.twilio__account_sid,
    twilio__auth_token: process.env.twilio__auth_token,
    twilio__messaging_phone_number:
      process.env.twilio__messaging_phone_number,
    campaigns__webhook_secret: process.env.campaigns__webhook_secret,
    unsubscribe__secret: process.env.unsubscribe__secret,
    org__postal_address: process.env.org__postal_address,
  });
  return cachedEnv;
}

function requireTableView(
  tableId: string | undefined,
  viewId: string | undefined,
  feature: string,
): { tableId: string; viewId: string } {
  if (!tableId || !viewId) {
    throw new Error(
      `Missing ${feature} configuration: both table_id and view_id must be set`,
    );
  }
  return { tableId, viewId };
}

/**
 * Centralized config. All values are read from env vars named
 * component__variable_name. Lazy validation: getters throw only when
 * a feature is used and its required vars are missing.
 */
export const config = {
  /** App-level (base URL, node env). Always available; base URL defaults to localhost. */
  get app() {
    const e = getEnv();
    const nodeEnv =
      e.app__node_env ??
      (process.env.NODE_ENV as "development" | "production" | "test" | undefined) ??
      "development";
    return {
      baseUrl: e.app__base_url ?? "http://localhost:3000",
      nodeEnv,
      isProduction: nodeEnv === "production",
      logLevel:
        e.app__log_level ?? (nodeEnv === "production" ? "info" : "debug"),
      serviceName: e.app__service_name ?? "ajd-site",
    };
  },

  /**
   * NocoDB client (base URL + API token). Required for any NocoDB feature.
   * Env: nocodb__base_url, nocodb__api_token.
   */
  get nocodb() {
    const e = getEnv();
    if (!e.nocodb__base_url || !e.nocodb__api_token) {
      throw new Error(
        "Missing NocoDB configuration: nocodb__base_url and nocodb__api_token must be set"
      );
    }
    return {
      baseUrl: e.nocodb__base_url,
      apiToken: e.nocodb__api_token,
    };
  },

  get users(): { tableId: string; viewId: string } {
    const e = getEnv();
    return requireTableView(e.nocodb__users__table_id, e.nocodb__users__view_id, "Users");
  },

  /** CMS feature. Optional; returns null if not set. */
  get cms(): { tableId: string; viewId: string } | null {
    const e = getEnv();
    if (!e.nocodb__cms__table_id || !e.nocodb__cms__view_id) return null;
    return { tableId: e.nocodb__cms__table_id, viewId: e.nocodb__cms__view_id };
  },

  get candidates(): { tableId: string; viewId: string } {
    const e = getEnv();
    return requireTableView(
      e.nocodb__candidates__table_id,
      e.nocodb__candidates__view_id,
      "Candidates",
    );
  },

  get presignedLinks(): { tableId: string; viewId: string } {
    const e = getEnv();
    return requireTableView(
      e.nocodb__presigned_links__table_id,
      e.nocodb__presigned_links__view_id,
      "PresignedLinks",
    );
  },

  get campaigns(): { tableId: string; viewId: string } {
    const e = getEnv();
    return requireTableView(
      e.nocodb__campaigns__table_id,
      e.nocodb__campaigns__view_id,
      "Campaigns",
    );
  },

  get campaignSends(): { tableId: string; viewId: string } {
    const e = getEnv();
    return requireTableView(
      e.nocodb__campaign_sends__table_id,
      e.nocodb__campaign_sends__view_id,
      "CampaignSends",
    );
  },

  /**
   * Optional feature flags / URLs. Env: features__whatsapp_link, features__geocodio_api_key.
   */
  get features() {
    const e = getEnv();
    return {
      whatsappLink:
      e.features__whatsapp_link ?? undefined,
      geocodioApiKey: e.features__geocodio_api_key,
    };
  },

  /**
   * Twilio Email API. All fields required to send; otherwise null (no-op in dev).
   * Env: twilio__account_sid, twilio__auth_token, twilio__from_email, twilio__from_name (optional).
   */
  get twilioEmail(): {
    accountSid: string;
    authToken: string;
    fromEmail: string;
    fromName: string;
  } | null {
    const e = getEnv();
    const accountSid = e.twilio__account_sid?.trim();
    const authToken = e.twilio__auth_token?.trim();
    const fromEmail = e.twilio__from_email?.trim();
    if (!accountSid || !authToken || !fromEmail) return null;
    const fromName =
      e.twilio__from_name?.trim() || "American Jews for Democracy";
    return { accountSid, authToken, fromEmail, fromName };
  },

  /**
   * Twilio SMS. All fields required to send; otherwise null.
   * Env: twilio__account_sid, twilio__auth_token, twilio__messaging_phone_number.
   */
  get twilioSms(): {
    accountSid: string;
    authToken: string;
    messagingPhoneNumber: string;
  } | null {
    const e = getEnv();
    const accountSid = e.twilio__account_sid?.trim();
    const authToken = e.twilio__auth_token?.trim();
    const messagingPhoneNumber = e.twilio__messaging_phone_number?.trim();
    if (!accountSid || !authToken || !messagingPhoneNumber) return null;
    return { accountSid, authToken, messagingPhoneNumber };
  },

  /**
   * Campaign sending. The webhook secret authenticates NocoDB -> /api/campaigns/send.
   * The unsubscribe secret signs stateless opt-out tokens. Both required to send.
   * Org postal address is optional (only relevant for commercial mail).
   */
  get campaignSending(): {
    webhookSecret: string;
    unsubscribeSecret: string;
    orgPostalAddress: string;
  } {
    const e = getEnv();
    const webhookSecret = e.campaigns__webhook_secret?.trim();
    const unsubscribeSecret = e.unsubscribe__secret?.trim();
    const orgPostalAddress = e.org__postal_address?.trim() ?? "";
    if (!webhookSecret || !unsubscribeSecret) {
      throw new Error(
        "Missing campaign configuration: campaigns__webhook_secret and unsubscribe__secret must be set",
      );
    }
    return { webhookSecret, unsubscribeSecret, orgPostalAddress };
  },

  /** Unsubscribe signing key alone (used by token verify on the public unsubscribe path). */
  get unsubscribeSecret(): string {
    const e = getEnv();
    const secret = e.unsubscribe__secret?.trim();
    if (!secret) {
      throw new Error("Missing unsubscribe__secret configuration");
    }
    return secret;
  },
};
