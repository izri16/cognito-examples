import {BrowserRouter as Router, Switch} from 'react-router-dom'
import Cookies from 'js-cookie'
import {Registration, Login, ForgotPassword} from './loginForms'
import {
  AuthProvider,
  AuthRoute,
  NoAuthRoute,
  useAuth,
  LOGIN_STATUS,
} from './AuthProvider'
import {Dashboard} from './Dashboard'
import {config} from './config'

// Note: CORS are blocked for "config.cognito.appUrl" so one can not use fetch or XmlHttpRequest
// without changing the options via cognito lamdba functions & other setup
const useGetOAuth2Url = (provider) => {
  // Note: the "csrfLoginToken" is set after "renew" endpoint so at the time of the page load
  // it is "undefined" or set to old value
  const {authState} = useAuth()
  const enc = encodeURIComponent

  // Used to avoid CSRF login
  // The token can be stolen via XSS, however attacker can not login via it,
  // the worst that he can do is to login user
  const state =
    authState !== LOGIN_STATUS.unknown ? enc(Cookies.get('csrfLoginToken')) : ''

  return `${
    config.cognito.appUrl
  }/oauth2/authorize?identity_provider=${provider}&response_type=code&client_id=${enc(
    config.cognito.clientId
  )}&redirect_uri=${config.serverUrl}/auth/callback&state=${state}`
}

const AppContent = () => {
  const fbLoginLink = useGetOAuth2Url('Facebook')
  return (
    <Switch>
      <NoAuthRoute exact path="/">
        <>
          <Login />
          <Registration />
          <ForgotPassword />
          <a href={fbLoginLink}>Login with FB</a>
        </>
      </NoAuthRoute>
      <AuthRoute exact path="/dashboard">
        <Dashboard />
      </AuthRoute>
    </Switch>
  )
}

const App = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
)

export default App
