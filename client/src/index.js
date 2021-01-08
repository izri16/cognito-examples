import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

// TODOs:
// => verify token expiration
// => test "retry" logic
// => sum up ideas in README
// => sum up other options in README, client SDK, ...
// => require correct node version for this REPO
// => single "yarn dev" && "yarn start" scripts to run all
// => test prod && final cleanup

// Start experimenting with Auth0 after this sum-up is done

// DOCS
// => why not vulnerable against CSRF
// => why not vulnerable against XSS

// Other options: (1)
// 1. Use greater expiration for access_token e.g. (not max is one day!)
// -> not that user friendly as you can not refresh it, but simpler to start with
// 2. basically ignore "refresh_token" and store_access token in httpOnly cookie
// 3. Disable cors, use application/json + CSRF token

// Other options: (2)
// Upload custom templates: (I do not like this one)

// You can customize a lot of aspects as you are proxy between cognito, either using
// their lambdas or custom "server"
// 1. Custom lockout mechanism
// 2. For custom (i18n emails) you would anyway need to write lambdas
// 3. Avoid account enumeration by changing cognito messages
// 4. Six digits request code? .... hope that they did it right???
// 5. MFA/Social support (should I test this?)

// Also i18n does not play well with built-in templates

// The proposed approach can introduce quite a lot of "renew" requests (pay for that)

// Still better to use "not-nice api" than to care about passwords management

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
