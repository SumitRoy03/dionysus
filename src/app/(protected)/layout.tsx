import { SidebarProvider } from '@/components/ui/sidebar'
import { UserButton } from '@clerk/nextjs'
import React from 'react'
import AppSidebar from './app-sidebar/page'

type SidebarLayoutProps = {
    children: React.ReactNode
}

const SidebarLayout = ({children} : SidebarLayoutProps) => {
  return (
    <SidebarProvider>
        {/* App sidebar */}
        <AppSidebar />
        <main className='w-full m-2'>
            <div className='flex items-center gap-2 border-sidebar-border bg-sidebar border shadow rounded-md p-2 px-4'>
                {/* Search bar */}
                <div className='ml-auto'></div>
                {/* User profile */}
                <UserButton />
            </div>

            <div className="h-4"></div>
                {/* main content */}
                <div className='border-sidebar-border bg-sidebar border shadow rounded-md overflow-y-scroll h-[calc(100vh-6rem)] p-2 px-4'>
                    {children}
                </div>
        </main>
    </SidebarProvider>
  )
}

export default SidebarLayout