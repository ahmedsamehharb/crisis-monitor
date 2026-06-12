export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode = 500,
    readonly code = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}
