import {config} from './config'

export const loadAccessToken = async () => {
  const res = await apiRequest('auth/renew', 'POST')
  if (res.status !== 200) {
    return null
  }
  const data = await res.json()
  return data.accessToken
}

const withAccessTokenRetry = async (fn, logout) => {
  let res = await fn()

  if (res.status === 401) {
    // AccessToken might be expired, try to grab new one
    // TODO: we should be able to check token expiration directly
    const accessToken = await loadAccessToken()

    if (!accessToken) {
      // TODO: rething
      logout && (await logout())
    }

    setApiRequest(accessToken)
    res = await fn()
  }
  return res
}

const getApiRequest = (accessToken, logout) => async (path, method, data) => {
  const url = `${config.serverUrl}/${path}`

  const isCookiePath = path.startsWith('auth')

  const options = {
    method,
    cache: 'no-cache',
    credentials: isCookiePath
      ? config.dev
        ? 'include'
        : 'same-origin'
      : 'omit',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': accessToken,
    },
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  return await withAccessTokenRetry(() => fetch(url, options))
}

export let apiRequest = getApiRequest()

export const setApiRequest = (accessToken, logout) => {
  apiRequest = getApiRequest(accessToken, logout)
}
