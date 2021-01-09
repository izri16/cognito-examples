import React from 'react'
import {apiRequest} from './api'
import {useAuth} from './AuthProvider'
import {useLocation, useHistory} from 'react-router-dom'

export const Dashboard = () => {
  const {logout} = useAuth()
  const [data, setData] = React.useState(null)
  const location = useLocation()
  const history = useHistory()

  React.useEffect(() => {
    // FB redirect sets #_=_ for some reason
    if (window.location.hash && window.location.hash === '#_=_') {
      history.replace({
        pathname: location.pathname,
        search: location.search,
      })
    }

    apiRequest('data', 'GET').then(({data}) => {
      setData(data)
    })
  }, [location, history])

  return (
    <>
      <div>{data ? JSON.stringify(data) : ''}</div>
      <button onClick={logout}>Logout</button>
    </>
  )
}
