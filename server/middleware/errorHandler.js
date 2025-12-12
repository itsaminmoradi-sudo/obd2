export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Don't expose sensitive error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const message = isDevelopment ? err.message : 'Internal server error';
  const stack = isDevelopment ? err.stack : undefined;

  res.status(err.status || 500).json({
    error: {
      message,
      ...(stack && { stack }),
      timestamp: new Date().toISOString(),
    },
  });
}
