export * from './User';
export * from './Folder';
export * from './File';
export * from './Permission';
export * from './Share';

// Common types
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface SearchParams {
  query: string;
  type?: 'file' | 'folder' | 'all';
  mime_type?: string;
  date_from?: Date;
  date_to?: Date;
  size_min?: number;
  size_max?: number;
  tags?: string[];
}
