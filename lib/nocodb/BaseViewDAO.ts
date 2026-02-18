import { unstable_cache } from "next/cache";
import type { Api } from "nocodb-sdk";
import { config } from "@/lib/config";
import { NocoDBClientFactory } from "./client";

export interface ListRecordsParams {
  where?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  fields?: string[];
}

export interface NocoDB_PageInfo {
  totalRows: number;
  page: number;
  pageSize: number;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export interface NocoDB_ListResponse<T = Record<string, unknown>> {
  list: T[];
  pageInfo: NocoDB_PageInfo;
}

/**
 * Abstract base class for NocoDB view-based data access.
 * Subclasses provide a table ID and view ID and gain cached record retrieval.
 */
export abstract class BaseViewDAO {
  protected api: Api<unknown>;
  protected tableId: string;
  protected viewId: string;
  protected ttl: number;

  constructor(tableId: string, viewId: string, ttl?: number) {
    this.api = NocoDBClientFactory.getClient();
    this.tableId = tableId;
    this.viewId = viewId;
    this.ttl = ttl ?? (config.app.isProduction ? 60 * 60 : 0);
  }

  /**
   * Fetch records from the NocoDB view, with Next.js data cache integration.
   * Results are cached using `unstable_cache` with the configured TTL.
   */
  protected async listRecords<T = Record<string, unknown>>(
    params?: ListRecordsParams
  ): Promise<NocoDB_ListResponse<T>> {
    const queryParams = {
      viewId: this.viewId,
      offset: params?.offset ?? 0,
      limit: params?.limit ?? 100,
      ...(params?.where && { where: params.where }),
      ...(params?.sort && { sort: params.sort }),
      ...(params?.fields && { fields: params.fields }),
    };

    const cacheKey = [
      "nocodb",
      this.tableId,
      this.viewId,
      JSON.stringify(queryParams),
    ];

    const fetcher = async (): Promise<NocoDB_ListResponse<T>> => {
      const response = await this.api.dbDataTableRow.list(
        this.tableId,
        queryParams
      );
      return response as unknown as NocoDB_ListResponse<T>;
    };

    if (this.ttl <= 0) {
      return fetcher();
    }

    return unstable_cache(fetcher, cacheKey, {
      revalidate: this.ttl,
    })();
  }

  /**
   * Create a new record in the NocoDB table.
   */
  protected async createRecord<T = Record<string, unknown>>(
    data: Record<string, unknown>
  ): Promise<T> {
    const response = await this.api.dbDataTableRow.create(this.tableId, data);
    return response as unknown as T;
  }

  /**
   * Update an existing record in the NocoDB table by row ID.
   */
  protected async updateRecord<T = Record<string, unknown>>(
    rowId: number,
    data: Record<string, unknown>
  ): Promise<T> {
    const response = await this.api.dbDataTableRow.update(this.tableId, {
      Id: rowId,
      ...data,
    });
    return response as unknown as T;
  }
}
