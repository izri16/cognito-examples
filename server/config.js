import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 3001,
  clientDevHost: process.env.CLIENT_DEV_HOST || 'http://localhost:3000',
  allowedDevCorsOrigin: process.env.ALLOWED_DEV_CORS_ORIGIN,
  dev: process.env.NODE_ENV !== 'production',
  https: process.env.HTTPS === 'true',
  cognito: {
    clientId: process.env.COGNITO_CLIENT_ID,
    secret: process.env.COGNITO_SECRET,
    poolUrl: process.env.COGNITO_POOL_URL,
  },
}
