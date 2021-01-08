export const config = {
  serverUrl: process.env.REACT_APP_SERVER_URL || window.origin,
  dev: process.env.NODE_ENV !== 'production',
}
