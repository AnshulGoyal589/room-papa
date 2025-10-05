import AddItemModal from '@/components/manager/HomePage/AddItemModal'
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react'

const page = async () => {
  const {userId} = await auth();
  if(!userId) {
    redirect('/');
  }
  return (
    < >
        <AddItemModal/>
    </>
  )
}

export default page