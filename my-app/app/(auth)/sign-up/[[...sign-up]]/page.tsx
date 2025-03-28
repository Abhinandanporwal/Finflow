import { SignUp } from '@clerk/nextjs'
import React from 'react'
// here we in side (auth) asto bypass the folder without bypassing its content
//[[...sign-up]] is contact route 
const page = () => {
  return (
    <div><SignUp/></div>
  )
}

export default page