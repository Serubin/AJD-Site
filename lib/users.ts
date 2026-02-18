import { UsersDAO, type CreateUserInput, type UserRecord } from "./nocodb/UsersDAO";

export type { CreateUserInput, UserRecord };

let users: UsersDAO | null = null;

function isUsersConfigured(): boolean {
  return !!(
    process.env.NOCODB_BASE_URL &&
    process.env.NOCODB_API_TOKEN &&
    process.env.USERS_TABLE_ID &&
    process.env.USERS_VIEW_ID
  );
}

function getUsersDAO(): UsersDAO {
  if (!isUsersConfigured()) {
    throw new Error("Users environment variables not configured");
  }

  if (!users) {
    users = new UsersDAO();
  }
  return users;
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const dao = getUsersDAO();
  return dao.createUser(input);
}

export async function findUser(
  email?: string,
  phone?: string
): Promise<UserRecord | null> {
  const dao = getUsersDAO();
  return dao.findByEmailOrPhone(email, phone);
}

export async function updateUser(
  id: number,
  input: CreateUserInput
): Promise<UserRecord> {
  const dao = getUsersDAO();
  return dao.updateUser(id, input);
}
