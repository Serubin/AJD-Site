import { UsersDAO, type CreateUserInput, type UserRecord } from "./nocodb/UsersDAO";
import { lazyInit } from "./utils";

export type { CreateUserInput, UserRecord };

const getUsersDAO = lazyInit(() => new UsersDAO());

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

export async function findUserById(id: number): Promise<UserRecord | null> {
  const dao = getUsersDAO();
  return dao.findById(id);
}

export async function updateUser(
  id: number,
  input: CreateUserInput
): Promise<UserRecord> {
  const dao = getUsersDAO();
  return dao.updateUser(id, input);
}

export async function updateUserVerified(
  id: number,
  verified: boolean
): Promise<UserRecord> {
  const dao = getUsersDAO();
  return dao.updateUserVerified(id, verified);
}

export async function checkEmailPhoneUniqueness(
  email: string,
  phone: string,
  excludeUserId?: number
): Promise<{ emailTaken: boolean; phoneTaken: boolean }> {
  const dao = getUsersDAO();
  const byEmail = await dao.findByEmail(email);
  const emailTaken =
    !!byEmail && (excludeUserId === undefined || byEmail.Id !== excludeUserId);
  let phoneTaken = false;
  if (phone.trim() !== "") {
    const byPhone = await dao.findByPhone(phone);
    phoneTaken =
      !!byPhone &&
      (excludeUserId === undefined || byPhone.Id !== excludeUserId);
  }
  return { emailTaken, phoneTaken };
}
