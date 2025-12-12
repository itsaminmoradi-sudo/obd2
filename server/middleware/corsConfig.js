export function corsConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER === 'true';

  let allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

  if (isProduction || isRender) {
    allowedOrigins = [
      'https://obd2-diagnostic-app.onrender.com',
      'https://localhost:3000',
    ];
  }

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  };
}
