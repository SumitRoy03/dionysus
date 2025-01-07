'use client';
import useProject from '@/hooks/use-project'
import { ExternalLink, Github } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

const DashboardPage = () => {

  const { project, projectId }= useProject();
  return (
    <div>
      <h1 className='text-2xl font-semibold'>{projectId}</h1>
      <div className='flex items-center justify-between flex-wrap gap-y-4'>
        {/* github link */}
        <div className='w-fit rounded-md bg-primary px-4 py-3'>
          <div className="flex items-center">
          <Github className='size-5 text-white' />
          <div className="ml-2">
            <p className='text-sm font-medium text-white'>
              This project is linked to {' '}
              <Link href={project?.githubUrl ?? ""} className='inline-flex items-center text-white/80 hover:underline'>
              {project?.githubUrl}
              <ExternalLink className='size-4 ml-1' />
              </Link> 
            </p>
          </div>
          </div>
        </div>

        <div className="h-4"></div>

        <div className='flex items-center gap-4'>
          Teammember
          InviteButton
          ArchieveButton 
        </div>


      </div>

      <div className="mt-4">
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-5'>
          AskQuestionCard 
          MeetingCard 
        </div>
      </div>

      <div className='mt-8'>
        commitLoggCard
      </div>
    </div>
  )
}

export default DashboardPage