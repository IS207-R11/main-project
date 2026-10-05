import { apiClient } from '../client';
import { ApiResponse, PaginatedResponse } from '../types/common';
import {
  ChangeReportStatusRequest,
  ListReportsParams,
  Report,
  SubmitReportRequest,
} from '../types/reports';

export const reportsApi = {
  /**
   * GET /reports
   * Get list of reports (ADMIN or MODERATOR)
   */
  list: (params?: ListReportsParams): Promise<PaginatedResponse<Report>> => {
    return apiClient<PaginatedResponse<Report>>('/reports', {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * POST /reports
   * Submit a feedback or error report (USER, ADMIN or MODERATOR)
   */
  create: (data: SubmitReportRequest): Promise<ApiResponse<Report>> => {
    return apiClient<ApiResponse<Report>>('/reports', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * PUT /reports/{reportId}/change-status
   * Change status of a report (ADMIN or MODERATOR)
   */
  changeStatus: (
    reportId: number,
    data: ChangeReportStatusRequest
  ): Promise<ApiResponse<Report>> => {
    return apiClient<ApiResponse<Report>>(`/reports/${reportId}/change-status`, {
      method: 'PUT',
      body: data,
    });
  },
};
