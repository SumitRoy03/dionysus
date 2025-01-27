'use client'
import { Button } from '@/components/ui/button';
import useProject from '@/hooks/use-project'
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import React from 'react'
import { toast } from 'sonner';

const ArchieveButton = () => {

    const { projectId } = useProject();

    const archieveProject = api.project.archieveProject.useMutation();
    const refetch = useRefetch();
//TODO : commits are of the archieved project are still present on the dashboard
  return (
    <Button size='sm' disabled={archieveProject.isPending} variant='destructive' onClick={() => archieveProject.mutate({projectId},
        {
            onSuccess: ()=>{
                toast.success('Project archieved')
                refetch()
            },
            onError: ()=>{
                toast.error('Failed to archieve')
            }
        }
    )}>
        Archieve
    </Button>
  )
}

export default ArchieveButton