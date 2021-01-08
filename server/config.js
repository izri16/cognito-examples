import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 3000,
  allowedDevCorsOrigin: process.env.ALLOWED_DEV_CORS_ORIGIN,
  dev: process.env.NODE_ENV !== 'production',
  https: process.env.HTTPS === 'true',
  cognito: {
    clientId: process.env.COGNITO_CLIENT_ID,
    secret: process.env.COGNITO_SECRET,
  },
}
