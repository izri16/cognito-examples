import React from 'react'
import {Route, Redirect, useHistory} from 'react-router-dom'
import {apiRequest, setApiRequest} from './api'

const LOGIN_STATUS = {
  unknown: 'unknown',
  loggedIn: 'loggedIn',
  loggedOut: 'loggedOut',
}

const AuthContext = React.createContext({
  authState: LOGIN_STATUS.unknown,
  login: null,
  logout: null,
  register: null,
  forgotPassword: null,
  forgotPasswordConfirm: null,
})

export const AuthProvider = ({children}) => {
  const history = useHistory()
  const [authState, setAuthState] = React.useState(LOGIN_STATUS.unknown)

  const logout = async () => {
    await apiRequest('auth/logout', 'POST')
    setApiRequest(null)
    setAuthState(LOGIN_STATUS.loggedOut)
    history.push('/')
  }

  const renew = async () => {
    const res = await apiRequest('auth/renew', 'POST')
    if (res.status === 200) {
      const data = await res.json()
      setApiRequest(data.accessToken)
      setAuthState(LOGIN_STATUS.loggedIn)
    } else {
      setAuthState(LOGIN_STATUS.loggedOut)
    }
  }

  const login = async (username, password) => {
    const res = await apiRequest('auth/login', 'POST', {
      username,
      password,
    })
    if (res.status === 200) {
      const data = await res.json()
      setApiRequest(data.accessToken)
      setAuthState(LOGIN_STATUS.loggedIn)
    }
  }

  const forgotPassword = async (username) => {
    return await apiRequest('auth/forgot-password', 'POST', {
      username,
    })
  }

  const forgotPasswordConfirm = async (username, password, code) => {
    return await apiRequest('auth/forgot-password-confirm', 'POST', {
      username,
      password,
      code,
    })
  }

  const register = async (username, password) => {
    await apiRequest('auth/register', 'POST', {
      username,
      password,
    })
  }

  React.useEffect(() => {
    renew()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        register,
        forgotPassword,
        forgotPasswordConfirm,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => React.useContext(AuthContext)

const Loading = () => <p>Loading ...</p>

export const AuthRoute = ({children, ...rest}) => {
  const {authState} = useAuth()
  return (
    <Route
      {...rest}
      render={({location}) => {
        if (authState === LOGIN_STATUS.unknown) {
          return <Loading />
        }
        if (authState === LOGIN_STATUS.loggedOut) {
          return <Redirect to="/" />
        }
        return children
      }}
    />
  )
}

export const NoAuthRoute = ({children, ...rest}) => {
  const {authState} = useAuth()
  return (
    <Route
      {...rest}
      render={({location}) => {
        if (authState === LOGIN_STATUS.unknown) {
          return <Loading />
        }
        if (authState === LOGIN_STATUS.loggedIn) {
          return <Redirect to="/dashboard" />
        }
        return children
      }}
    />
  )
}
