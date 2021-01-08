import express from 'express'
import axios from 'axios'
import {config} from '../config.js'
import {decodeAndVerifyToken, getSecretToken} from '../authUtils.js'

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

const router = express.Router()

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

    res.cookie('refreshToken', RefreshToken, {
      maxAge: 60 * 60 * 24 * 7, // TODO: get this value from refresh token
      httpOnly: true,
      secure: false,
    })
    // Note: we need to store "uuid username" as some AWS endpoints require it
    res.cookie('username', decodedAccessToken.username, {
      maxAge: 60 * 60 * 24 * 7, // TODO: get this value from refresh token
      httpOnly: true,
      secure: false,
    })
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
  res.sendStatus(200)
})

router.post('/renew', async (req, res) => {
  /*
  https://stackoverflow.com/questions/54430978/unable-to-verify-secret-hash-for-client-at-refresh-token-auth

  When calling REFRESH_TOKEN_AUTH, use the Cognito assigned UUID username when calculating the secret hash,
  and not the email address or other ID used to create the account and which is used with the other types of calls.
  */

  // Note: that this always return new access token

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
    await decodeAndVerifyToken(AccessToken)
    return res.json({
      accessToken: AccessToken,
    })
  } catch (err) {
    console.error('Renew error', err.response.data)
    return res.sendStatus(400)
  }
})

export default router
