// this is the file we create to wrap our content inside the auth folder in to some common style
import React from 'react'

const AuthLayout = ({children}) => {
  return (
    <div className="flex justify-center pt-40">{children}</div>
  )
}

export default AuthLayout;