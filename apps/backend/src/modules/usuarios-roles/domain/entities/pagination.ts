export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedList<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
