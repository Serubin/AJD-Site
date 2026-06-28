import { config } from "@/lib/config";
import { BaseViewDAO } from "./BaseViewDAO";

export interface UserRecord {
  Id?: number;
  Name: string;
  Email: string;
  Phone: string;
  States: string;
  CongressionalDistrict: string;
  /** When undefined/null, treat as verified (backwards compatibility). */
  Verified?: boolean;
  /** Set when the user unsubscribes from marketing email. */
  EmailOptedOut?: boolean;
  /** Set when the user replies STOP to marketing SMS. */
  SmsOptedOut?: boolean;
  EmailOptedOutAt?: string | null;
  SmsOptedOutAt?: string | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  states: string[];
  congressionalDistrict: string;
}

/**
 * Data Access Object for user sign-ups stored in NocoDB.
 * Handles creating new user records from the sign-up form.
 */
export class UsersDAO extends BaseViewDAO {
  constructor() {
    const { tableId, viewId } = config.users;
    super(tableId, viewId, 0);
  }

  /**
   * Create a new user record from sign-up form data.
   * States are stored as a comma-separated string (e.g. "CA,NY").
   */
  async createUser(input: CreateUserInput): Promise<UserRecord> {
    return this.createRecord<UserRecord>({
      Name: input.name,
      Email: input.email,
      Phone: input.phone,
      States: input.states.join(","),
      CongressionalDistrict: input.congressionalDistrict,
      Verified: false,
    });
  }

  /**
   * Find a user by email and/or phone number.
   * Returns the first matching record, or null if none found.
   */
  async findByEmailOrPhone(
    email?: string,
    phone?: string
  ): Promise<UserRecord | null> {
    const conditions: string[] = [];
    if (email) conditions.push(`(Email,eq,${email})`);
    if (phone) conditions.push(`(Phone,eq,${phone})`);

    if (conditions.length === 0) return null;

    const where = conditions.join("~or");
    const result = await this.listRecords<UserRecord>({ where, limit: 1 });
    return result.list.length > 0 ? result.list[0] : null;
  }

  /**
   * Find a user by email.
   * Returns the first matching record, or null if none found.
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    const where = `(Email,eq,${email})`;
    const result = await this.listRecords<UserRecord>({ where, limit: 1 });
    return result.list.length > 0 ? result.list[0] : null;
  }

  /**
   * Find a user by phone number.
   * Returns the first matching record, or null if none found.
   */
  async findByPhone(phone: string): Promise<UserRecord | null> {
    const where = `(Phone,eq,${phone})`;
    const result = await this.listRecords<UserRecord>({ where, limit: 1 });
    return result.list.length > 0 ? result.list[0] : null;
  }

  /**
   * Find a user by their NocoDB row ID.
   * Returns null if not found.
   */
  async findById(id: number): Promise<UserRecord | null> {
    const where = `(Id,eq,${id})`;
    const result = await this.listRecords<UserRecord>({ where, limit: 1 });
    return result.list.length > 0 ? result.list[0] : null;
  }

  /**
   * Update an existing user record.
   */
  async updateUser(id: number, input: CreateUserInput): Promise<UserRecord> {
    return this.updateRecord<UserRecord>(id, {
      Name: input.name,
      Email: input.email,
      Phone: input.phone,
      States: input.states.join(","),
      CongressionalDistrict: input.congressionalDistrict,
    });
  }

  /**
   * Set the Verified flag on a user (e.g. after sign-up confirmation).
   */
  async updateUserVerified(id: number, verified: boolean): Promise<UserRecord> {
    return this.updateRecord<UserRecord>(id, { Verified: verified });
  }

  /**
   * Set the marketing email opt-out flag (CAN-SPAM unsubscribe).
   */
  async setEmailOptedOut(id: number, optedOut: boolean): Promise<UserRecord> {
    return this.updateRecord<UserRecord>(id, {
      EmailOptedOut: optedOut,
      EmailOptedOutAt: optedOut ? new Date().toISOString() : null,
    });
  }

  /**
   * Set the marketing SMS opt-out flag (TCPA STOP keyword).
   */
  async setSmsOptedOut(id: number, optedOut: boolean): Promise<UserRecord> {
    return this.updateRecord<UserRecord>(id, {
      SmsOptedOut: optedOut,
      SmsOptedOutAt: optedOut ? new Date().toISOString() : null,
    });
  }

  /**
   * Stream every user record, paging past the per-request limit.
   * Used to enumerate campaign recipients regardless of audience size.
   */
  async listAllUsers(pageSize = 200): Promise<UserRecord[]> {
    const all: UserRecord[] = [];
    let offset = 0;

    for (;;) {
      const result = await this.listRecords<UserRecord>({
        limit: pageSize,
        offset,
      });
      all.push(...result.list);
      if (result.pageInfo?.isLastPage || result.list.length === 0) break;
      offset += result.list.length;
    }

    return all;
  }
}
