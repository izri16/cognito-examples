export const config = {
  serverUrl: process.env.REACT_APP_SERVER_URL || window.origin,
  dev: process.env.NODE_ENV !== 'production',
  cognito: {
    appUrl: process.env.REACT_APP_COGNITO_APP_URL,
    clientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
  },
}
