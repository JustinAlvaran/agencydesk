import React from 'react'

const Loader = () => {
  return (
    <div className="flex justify-center my-10">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-current border-t-transparent rounded-full text-red-600" role="status" aria-label="Loading" />
    </div>
  )
}

export default Loader