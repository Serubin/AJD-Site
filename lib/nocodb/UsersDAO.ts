import { BaseViewDAO } from "./BaseViewDAO";

export interface UserRecord {
  Id?: number;
  Name: string;
  Email: string;
  Phone: string;
  States: string;
  CongressionalDistrict: string;
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
    const tableId = process.env.USERS_TABLE_ID;
    const viewId = process.env.USERS_VIEW_ID;

    if (!tableId || !viewId) {
      throw new Error(
        "Missing Users configuration: USERS_TABLE_ID and USERS_VIEW_ID must be set"
      );
    }

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
}
