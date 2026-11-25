declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: Record<string, unknown>;
        params?: Record<string, string>;
      };
    }
  }
}