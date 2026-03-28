import { config } from "@/lib/config";
import { BaseViewDAO } from "./BaseViewDAO";

interface RawCandidateRecord {
  Id: number;
  Title?: string;
  Name?: string;
  District: string;
  State: string;
  Photo: string;
  Description: string;
}

export interface CandidateRecord {
  Id: number;
  Name: string;
  District: string;
  State: string;
  Photo: string;
  Description: string;
}

export class CandidatesDAO extends BaseViewDAO {
  constructor() {
    const { tableId, viewId } = config.candidates;
    super(tableId, viewId);
  }

  async listCandidates(): Promise<CandidateRecord[]> {
    const result = await this.listRecords<RawCandidateRecord>({ limit: 100 });
    return result.list
      .map((r) => ({
        Id: r.Id,
        Name: r.Name ?? r.Title ?? "",
        District: r.District ?? "",
        State: r.State ?? "",
        Photo: r.Photo ?? "",
        Description: r.Description ?? "",
      }))
      .filter((r) => r.Name !== "");
  }
}
