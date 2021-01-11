# cognito-examples

Proof-of-concept app using Cognito authentication via API and custom nodejs server + React.
The goal is to store `refresh_token` in httpOnly cookie and `access_token` closured in
memory so that tokens are protected towards XSS.
The example does not use default built-in template authentication, but instead shows usage with custom (raw) UI and custom social login (facebook).

App is running at https://cognito-server.herokuapp.com/.

## Local setup

1. Register with AWS console, create Cognito user pool, set proper settings in AWS console (TODO: describe)
1. Copy `.env.template` into `.env` in both `server` and `client` folders and fill with proper values
2. Install dependencies and run
```
yarn
yarn dev
```

## General Cognito notes

### User pools
User pools is the concept that Cognito use to store users accounts. There is also Identity Pools concept which is only relevant when granting permissions
to other AWS services.
User pools supports a lot of attributes and you can also add 25 more custom attributes, but you need to care about their
length (max 2048 characters).

### Cognito application
In order to get required application keys you need to create cognito application. You can create multiple applications for a single pool. E.g. one for server (secret required)
using and one for mobile/web (not using secret). When creating application you provide "callback" URLs in Cognito console. Cognito will redirect
to those URL on login (using templates) or OAuth actions.

### Cognito SDK for web/native client
There are aws-amplify SDKs, but those do not store tokens safely. They use localStorage for web and AsyncStorage for react-native. Further experiments should be done
about the possible customizations & safe token storage, mainly in terms of web.

### Cognito API
It is always possible to directly use Cognito API (e.g. with nodejs) for having total control over authentication flow.

### Default templates
Cognito provides default templates (sign up / login form) when using domain provided by Cognito for authentication. Using Cognito domain for authentication is considered
safer & might be quicker, however, when a lot of customization and multi-language support is required, maintaining the templates may become difficult.
Whether building custom UI or using simple "templates" is more a business decision.

### Lambda functions
Cognito allows registering lambda functions for various "events" (called Triggers) in the authentication process to customize default behavior. This topic was left for further
experiments.

### Tokens
After login Cognito issues refresh/access token pair and ID token. The ID token holds data about user, access token is JWT token which should be used for
authorization (anyone can download user pool public key and check signature) and refresh token is used to get new access token.
Max age for access token is 1 day.
Storing refresh token in cookie consumes a lot of cookie "space" as refresh token has almost 2kb and cookie space is around 4kb.
However one may only send cookies for certain endpoints as access token is send in header (provides CSRF protection).

### Confirmation email (sign up / forgot password)
Cognito sends only 6 digit code for the sign up or forgot password actions. It is possible to choose sending link instead of 6 digit code, but anyway
then the link only contains 6 digit code encoded inside it. This might be potential threat for brute-force attacks as 6 digit code is not that
difficult to guess.

### Account enumeration
Cognito API returns "User already exist" response in certain cases (e.g. signUp) so in order to prevent against account enumeration one should either
use custom server that process the messages or register lambda trigger.

### Social login
Cognito only support Facebook, Google, Amazon and Apple for social login out-of-the-box.
When not using client SDK, one should care about the standard "state" parameter in OAuth 2.0 flow to avoid CSRF attack. There is example of that in code.
When handling pure SPA (without backend) or native app PKCE flow should be used, otherwise one should use Authorization Code Flow for OAuth 2.0.

### MFA
Cognito provides either SMS or Time-based one-time password (TOTP) multifactor authentication options. TOTP can be configured using Google Authenticator.

### Useful links
#### Cognito Auth0 endpoints

https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html
https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html

#### OAuth 2.0 options explained

https://aws.amazon.com/blogs/mobile/understanding-amazon-cognito-user-pool-oauth-2-0-grants/

#### Cognito lockout policy (magic, but one can still also implement custom one)

https://blog.ilearnaws.com/2020/05/10/dive-deep-on-the-lockout-policy-of-aws-cognito/

#### Cognito api reference
https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/Welcome.html

#### SPA with cookies Auth0 recommendations
https://auth0.com/docs/sessions-and-cookies/spa-authenticate-with-cookies

