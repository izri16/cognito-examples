import jwkToPem from 'jwk-to-pem'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import util from 'util'
import {config} from './config.js'

// Response from calling https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json
const pub = {
  keys: [
    {
      alg: 'RS256',
      e: 'AQAB',
      kid: '6rHuq3/0S9rQVAdSMbvtwDstiPB5nNkD3kd+knZHgCU=',
      kty: 'RSA',
      n:
        'vdRVp5rOsCY2DVwCL9SFEvlPV-d3gO8r9fBlLVqxsKUZpawi05XULZp1sOzGZFM9w0VbXJLZ3nsWJ7Rxliw6CqgOAE80LY3lPgNEb8XpK5SxvkCECtIdHjKcVGV0MO1b5bg68zskB51o3LUqxoIkgzpyBID7Hnafh6PIOWFjOe8ia9DVA-AhDINZZKWQ7Gk1RPTzbSe6AYdGvDW5Nc2btWEzs6f3kFXYnQpFhXG37w6L6F2aOSPR7u-aTVmACQk8MxzrlgPIKmBY1rKo3tTScZm8BfgCKcJMLJ72r4rLmu0Dc2JnNnWXgRnCjpUUlsOBpMyEPsLH1Zpk1tpdkSAIvQ',
      use: 'sig',
    },
    {
      alg: 'RS256',
      e: 'AQAB',
      kid: '84nKDZgSxPbSUo3AzfAY4CmgZmjqLzGhHhC2JAD4PhI=',
      kty: 'RSA',
      n:
        '3R2fM0DW1U5eGSp6u0UIWxR8UV8QNvsQfM7lOompeqvzmkDJGbvws6jHHRsGcJU0fHlrXGk877c9Rf_FBmp4raTKhy8kkvx-D6jv8CJ7w18JniIu06ucPa_zthp6DPn9TMmMbKSER4Xfdr2iu_Z6u_1jQ8mY79i5Xhw2K9GlTWiPz14ETF75AuBTJ9-o6ZGv2WjGl11CyMMcF7uqTRADvcYMIk3Z9Mci8PHmXKchWVZeQyr8SIMBjtbSc4gmzm90iqriQyT2LseruGXr8IlOQ_09-dz4DaxaeWz79IGLr42HflLyU1sSzQ4eLJ_b6nvauUjZJKcGAPG8wZIKFS2FKQ',
      use: 'sig',
    },
  ],
}

const verifyJWT = util.promisify(jwt.verify)

export const decodeAndVerifyToken = async (token) => {
  // Logix inpired by https://medium.com/@prasadjay/amazon-cognito-user-pools-in-nodejs-as-fast-as-possible-22d586c5c8ec
  const pems = {}
  const keys = pub['keys']
  for (let i = 0; i < keys.length; i++) {
    //Convert each key to PEM
    const key_id = keys[i].kid
    const modulus = keys[i].n
    const exponent = keys[i].e
    const key_type = keys[i].kty
    const jwk = {kty: key_type, n: modulus, e: exponent}
    const pem = jwkToPem(jwk)
    pems[key_id] = pem
  }
  const decodedJwt = jwt.decode(token, {complete: true})
  if (!decodedJwt) {
    throw new Error('Invalid JWT token')
  }

  const kid = decodedJwt.header.kid
  const pem = pems[kid]
  if (!pem) {
    throw new Error('Invalid token')
  }

  return await verifyJWT(token, pem)
}

export const getSecretToken = (username) => {
  return crypto
    .createHmac('SHA256', config.cognito.secret)
    .update(username + config.cognito.clientId)
    .digest('base64')
}

export const requireAuth = async (req, res, next) => {
  try {
    await decodeAndVerifyToken(req.headers['access-token'])
  } catch (err) {
    res.sendStatus(401)
    return
  }
  next()
}
