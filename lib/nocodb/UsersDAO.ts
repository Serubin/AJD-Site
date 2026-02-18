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

    super(tableId, viewId);
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
}
