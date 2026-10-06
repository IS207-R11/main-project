import { apiClient } from '../client';
import { ApiResponse } from '../types/common';

export interface UploadImageResult {
  url: string;
  secure_url: string;
  public_id: string;
}

export const uploadApi = {
  /**
   * POST /upload/image
   * Upload an image to server (handled via Cloudinary)
   * Authenticated user only, validates image format and size < 5MB
   */
  uploadImage: async (file: File): Promise<ApiResponse<UploadImageResult>> => {
    const formData = new FormData();
    formData.append('image', file);

    return apiClient<ApiResponse<UploadImageResult>>('/upload/image', {
      method: 'POST',
      body: formData,
    });
  },
};
