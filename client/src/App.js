import {BrowserRouter as Router, Switch} from 'react-router-dom'
import {Registration, Login, ForgotPassword} from './loginForms'
import {AuthProvider, AuthRoute, NoAuthRoute} from './AuthProvider'
import {Dashboard} from './Dashboard'

const AppContent = () => {
  return (
    <Switch>
      <NoAuthRoute exact path="/">
        <>
          <Login />
          <Registration />
          <ForgotPassword />
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
