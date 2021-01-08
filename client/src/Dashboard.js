import React from 'react'
import {apiRequest} from './api'
import {useAuth} from './AuthProvider'

export const Dashboard = () => {
  const {logout} = useAuth()
  const [data, setData] = React.useState(null)

  React.useEffect(() => {
    apiRequest('data', 'GET').then(async (res) => {
      const data = await res.json()
      setData(data)
    })
  }, [])

  return (
    <>
      <div>{data ? JSON.stringify(data) : ''}</div>
      <button onClick={logout}>Logout</button>
    </>
  )
}
