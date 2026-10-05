import { SortablePaginationParams } from './common';

export type ReportType = 'COMMENT' | 'ERROR';

export type ReportStatus = 'RESOLVED' | 'PENDING';

export interface ReportAuthor {
  user_id: number;
  username: string | null;
}

export interface Report {
  report_id: number;
  author: ReportAuthor;
  resolved_by: ReportAuthor | null;
  type: ReportType;
  status: ReportStatus;
  title: string | null;
  content: string;
  resolved_at: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface SubmitReportRequest {
  type?: ReportType;
  title?: string;
  content: string;
}

export interface ChangeReportStatusRequest {
  status: ReportStatus;
}

export interface ListReportsParams extends SortablePaginationParams {
  status?: ReportStatus;
  type?: ReportType;
}
