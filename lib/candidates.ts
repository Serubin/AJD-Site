import { CandidatesDAO, type CandidateRecord } from "./nocodb/CandidatesDAO";
import { connection } from "next/server";
import { lazyInit } from "./utils";

export type { CandidateRecord };

const getCandidatesDAO = lazyInit(() => new CandidatesDAO());

export async function getCandidates(): Promise<CandidateRecord[]> {
  await connection();
  const dao = getCandidatesDAO();
  return dao.listCandidates();
}
