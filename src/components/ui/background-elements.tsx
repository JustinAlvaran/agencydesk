import React from 'react'

const BackgroundElements = () => {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-white to-red-200/20 dark:from-red-900/10 dark:via-black dark:to-red-950/10"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-400/10 dark:bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 dark:bg-red-600/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}

export default BackgroundElements