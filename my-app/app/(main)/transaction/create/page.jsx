import React from 'react'
import {getUserAccounts} from "../../../../actions/dashboard"
import {defaultCategories} from "../../../../data/categories"
import {AddTransactionForm} from "../_components/transaction-form"
const AddTransactionPage = async() => {
    const accounts=await getUserAccounts();
  return (
    <div className='max-w-3xl mx-auto px-5 mt-23'>
        <h1 className='text-5xl gradient-text mb-8'>Add Transaction</h1>
        <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}/>
    </div>
  )
}

export default AddTransactionPage;