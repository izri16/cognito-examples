import {config} from './config'

const customFetch = async (...args) => {
  let data = null
  let error = null
  try {
    const res = await fetch(...args)
    const status = res.status
    let data = null

    if (res.ok) {
      try {
        data = await res.json()
        return {status, data, error}
      } catch (error) {
        return {status, data, error}
      }
    }
    // 400+ errors (consider getting error description/message)
    return {status, data, error}
  } catch (error) {
    // 500 errors
    return {status: 500, data, error}
  }
}

const getFetchHeaders = ({method, path, accessToken, data}) => {
  const sendCookies = path.startsWith('auth')
  const options = {
    method,
    cache: 'no-cache',
    credentials: sendCookies
      ? config.dev
        ? 'include'
        : 'same-origin'
      : 'omit',
    headers: {
      'Content-Type': 'application/json',
    },
  }
  if (accessToken) {
    options.headers['Access-Token'] = accessToken
  }
  if (data) {
    options.body = JSON.stringify(data)
  }
  return options
}

export const renewTokens = async () => {
  const path = 'auth/renew'
  const url = `${config.serverUrl}/${path}`
  const options = getFetchHeaders({method: 'POST', path})
  const {data} = await customFetch(url, options)
  return data
}

const getApiRequest = ({accessToken, accessTokenExpiration}) => async (
  path,
  method,
  data
) => {
  const url = `${config.serverUrl}/${path}`
  const options = getFetchHeaders({method, path, accessToken, data})

  // Get new access_token if the current will soon expire (30s)
  if (accessToken && Date.now() - accessTokenExpiration < 1000 * 30) {
    const renewData = await renewTokens()
    if (renewData) {
      accessToken = renewData.accessToken
      accessTokenExpiration = renewData.accessTokenExpiration
    }
  }
  return await customFetch(url, options)
}

export let apiRequest = getApiRequest({})

export const setApiRequest = (renewData) => {
  apiRequest = getApiRequest(renewData)
}
