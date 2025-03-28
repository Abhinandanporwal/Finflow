import { SignIn } from '@clerk/nextjs'
import React from 'react'
// here we in side (auth) asto bypass the folder without bypassing its content
//[[...sign-in]] is contact route 
const page = () => {
  return (
    <div><SignIn/></div>
  )
}

export default page