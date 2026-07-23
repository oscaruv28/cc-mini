/** Forma estándar de una respuesta paginada en toda la API. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
