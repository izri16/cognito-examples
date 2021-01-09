import express from 'express'
import axios from 'axios'
import qs from 'query-string'
import crypto from 'crypto'
import util from 'util'
import {config} from '../config.js'
import {decodeAndVerifyToken, getSecretToken} from '../authUtils.js'

// Notes: (this is just a proof-of-content) of how to use cognito API + custom server
// and store refreshToken safely in httpOnly cookie
// 1. Logging & error handling would need to be revisited
// 2. Failled social callback handling
// 3. Other endpoints & scenarious

// only used for http only cookies
const TEN_YEARS = 10 * 365 * 24 * 60 * 60

const randomBytes = util.promisify(crypto.randomBytes)

// API reference
// https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/Welcome.html

const cognitoRequest = async (action, data) => {
  const axiosConf = {
    method: 'post',
    url: 'https://cognito-idp.us-east-2.amazonaws.com',
    data,
    headers: {
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      'Content-Type': 'application/x-amz-json-1.1',
    },
  }
  return await axios(axiosConf)
}

const setLoginCookies = (res, refreshToken, username) => {
  res.cookie('refreshToken', refreshToken, {
    maxAge: TEN_YEARS,
    httpOnly: true,
    secure: config.https,
  })
  // Note: we need to store "uuid username" as some AWS endpoints require it
  res.cookie('username', username, {
    maxAge: TEN_YEARS,
    httpOnly: true,
    secure: config.https,
  })
}

const router = express.Router()

// Called after social login
router.get('/callback', async (req, res) => {
  const {code, state} = req.query
  const authStr = `${config.cognito.clientId}:${config.cognito.secret}`
  const authStrBuffer = new Buffer(authStr)
  const authStr64data = authStrBuffer.toString('base64')

  const serverUrl = `${config.https ? 'https://' : 'http://'}${
    req.headers.host
  }`

  const redirectUrl = config.dev ? config.clientDevHost : serverUrl

  if (req.cookies.csrfLoginToken !== state) {
    return res.redirect(redirectUrl)
  }

  const axiosConf = {
    method: 'post',
    url: `${config.cognito.poolUrl}/oauth2/token`,
    data: qs.stringify({
      grant_type: 'authorization_code',
      client_id: config.cognito.clientId,
      code,
      redirect_uri: `${serverUrl}/auth/callback`,
    }),
    headers: {
      Authorization: `Basic ${authStr64data}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }

  try {
    const {id_token, refresh_token, access_token} = (
      await axios(axiosConf)
    ).data
    const decodedAccessToken = await decodeAndVerifyToken(access_token)
    const decodedIdToken = await decodeAndVerifyToken(id_token)
    console.log('OIDC data', decodedIdToken.identities)
    setLoginCookies(res, refresh_token, decodedAccessToken.username)
    return res.redirect(redirectUrl)
  } catch (err) {
    console.error('OAuth2.0 error', err.response.data)
    return res.sendStatus(400)
  }
})

router.post('/register', async (req, res) => {
  try {
    const data = (
      await cognitoRequest('SignUp', {
        Username: req.body.username,
        Password: req.body.password,
        ClientId: config.cognito.clientId,
        SecretHash: getSecretToken(req.body.username),
      })
    ).data
    console.log('SignUp data', data)
    return res.sendStatus(200)
  } catch (err) {
    console.error('Registration error', err.response.data)
    return res.sendStatus(400)
  }
})

router.post('/login', async (req, res) => {
  try {
    const {AccessToken, RefreshToken, IdToken} = (
      await cognitoRequest('InitiateAuth', {
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: req.body.username,
          PASSWORD: req.body.password,
          SECRET_HASH: getSecretToken(req.body.username),
        },
        ClientId: config.cognito.clientId,
      })
    ).data.AuthenticationResult
    const decodedAccessToken = await decodeAndVerifyToken(AccessToken)
    await decodeAndVerifyToken(IdToken)
    setLoginCookies(res, RefreshToken, decodedAccessToken.username)
    return res.json({accessToken: AccessToken})
  } catch (err) {
    console.error('Login error', err.response.data)
    return res.sendStatus(400)
  }
})

// Note: this will send password reset code to email address 6 digits
router.post('/forgot-password', async (req, res) => {
  try {
    const data = (
      await cognitoRequest('ForgotPassword', {
        Username: req.body.username,
        ClientId: config.cognito.clientId,
        SecretHash: getSecretToken(req.body.username),
      })
    ).data
    console.log('Forgot password data', data)
    return res.sendStatus(200)
  } catch (err) {
    console.error('Forgot password error', err.response.data)
    return res.sendStatus(400)
  }
})

router.post('/forgot-password-confirm', async (req, res) => {
  try {
    const data = (
      await cognitoRequest('ConfirmForgotPassword', {
        Username: req.body.username,
        Password: req.body.password,
        ConfirmationCode: req.body.code,
        ClientId: config.cognito.clientId,
        SecretHash: getSecretToken(req.body.username),
      })
    ).data
    console.log('Forgot password (reset) data', data)
    return res.sendStatus(200)
  } catch (err) {
    console.error('Forgot password (reset) error', err.response.data)
    return res.sendStatus(400)
  }
})

router.post('/logout', async (req, res) => {
  res.clearCookie('refreshToken')
  res.clearCookie('username')
  res.clearCookie('csrfLoginToken')
  res.sendStatus(200)
})

router.post('/renew', async (req, res) => {
  /*
  https://stackoverflow.com/questions/54430978/unable-to-verify-secret-hash-for-client-at-refresh-token-auth

  When calling REFRESH_TOKEN_AUTH, use the Cognito assigned UUID username when calculating the secret hash,
  and not the email address or other ID used to create the account and which is used with the other types of calls.
  */

  // Note: that this always return new access token

  const csrfLoginToken = (await randomBytes(48)).toString('hex')
  res.cookie('csrfLoginToken', csrfLoginToken, {
    maxAge: TEN_YEARS,
    httpOnly: false,
    secure: config.https,
  })

  try {
    const {AccessToken} = (
      await cognitoRequest('InitiateAuth', {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: req.cookies.refreshToken,
          SECRET_HASH: getSecretToken(req.cookies.username),
        },
        ClientId: config.cognito.clientId,
      })
    ).data.AuthenticationResult
    const decodedAccessToken = await decodeAndVerifyToken(AccessToken)

    const csrfLoginToken = (await randomBytes(48)).toString('hex')
    res.cookie('csrfLoginToken', csrfLoginToken, {
      maxAge: TEN_YEARS,
      httpOnly: false,
      secure: config.https,
    })

    return res.json({
      accessToken: AccessToken,
      accessTokenExpiration: decodedAccessToken.exp * 1000,
    })
  } catch (err) {
    console.error('Renew error', err.response.data)
    return res.sendStatus(400)
  }
})

export default router
