import React from 'react'
import {useAuth} from './AuthProvider'

const useFormData = () => {
  const [formData, setFormData] = React.useState({
    username: '',
    password: '',
    code: '',
  })

  return {
    formData,
    onChange: (name) => (e) =>
      setFormData({...formData, [name]: e.target.value}),
  }
}

export const Login = () => {
  const {login} = useAuth()
  const {formData, onChange} = useFormData()

  const onSubmit = async (e) => {
    e.preventDefault()
    await login(formData.username, formData.password)
  }

  return (
    <>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={onChange('username')}
        />
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={onChange('password')}
        />
        <button type="submit">Login</button>
      </form>
      <hr />
    </>
  )
}

export const Registration = () => {
  const {register} = useAuth()
  const {formData, onChange} = useFormData()

  const onSubmit = async (e) => {
    e.preventDefault()
    await register(formData.username, formData.password)
  }

  return (
    <>
      <h2>Registration</h2>
      <form onSubmit={onSubmit}>
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={onChange('username')}
        />
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={onChange('password')}
        />
        <button type="submit">Register</button>
      </form>
      <hr />
    </>
  )
}

export const ForgotPassword = () => {
  const [recoveryState, setRecoveryState] = React.useState('init')
  const {forgotPassword, forgotPasswordConfirm} = useAuth()
  const {formData, onChange} = useFormData()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (recoveryState === 'confirm') {
      const res = await forgotPasswordConfirm(
        formData.username,
        formData.password,
        formData.code
      )
      if (res.status === 200) {
        setRecoveryState('success')
      }
    } else if (recoveryState === 'init') {
      await forgotPassword(formData.username)
      setRecoveryState('confirm')
    }
  }

  return (
    <>
      <h2>Forgot password</h2>
      {recoveryState === 'init' && (
        <form onSubmit={onSubmit}>
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={onChange('username')}
          />
          <button type="submit">Send recovery code</button>
        </form>
      )}
      {recoveryState === 'confirm' && (
        <form onSubmit={onSubmit}>
          <p>Please provide recovery code from your email</p>
          <label>Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={onChange('code')}
          />
          <label>New password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange('password')}
          />
          <button type="submit">Set password</button>
        </form>
      )}
      {recoveryState === 'success' && (
        <p>Password was changed, please log in.</p>
      )}
    </>
  )
}
