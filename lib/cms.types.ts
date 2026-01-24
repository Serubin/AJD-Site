export type ContentType = "markdown" | "yaml" | "json";

export interface CMSRecord {
  Id: number;
  Page: string;
  Sub: string;
  Type: ContentType;
  Content: string;
}

export interface CMSSection {
  type: ContentType;
  raw: string;
  parsed: unknown;
}

export interface TeamMember {
  name: string;
  title: string;
  photo?: string;
}

export interface CMSResponse {
  list: CMSRecord[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}
