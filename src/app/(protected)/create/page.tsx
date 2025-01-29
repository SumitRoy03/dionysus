'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import { redirect } from 'next/navigation';
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner';
import { Info, Loader2 } from 'lucide-react'
import useProject from '@/hooks/use-project';

type FormInput = {
    repoUrl : string,
    projectName : string,
    githubToken? : string,
}

const CreatePage = () => {

    const { register, handleSubmit, reset} = useForm<FormInput>()
    const createProject  = api.project.createProject.useMutation();
    const checkCredits = api.project.checkCredits.useMutation();
    const refetch = useRefetch();

    function onSubmit(data: FormInput) {
        // console.log(data);
        if(!!checkCredits.data) {
            createProject.mutateAsync({
                githubUrl: data.repoUrl,
                name: data.projectName,
                githubToken: data.githubToken
            }, {
                onSuccess: () => {
                    reset();
                    toast.success('Project created successfully');
                    refetch();
                },
                onError: (err) => {
                    toast.error(err.message);
                }
            })
        } else {
            checkCredits.mutate({
                githubUrl: data.repoUrl,
                githubToken: data.githubToken
            })
        }
    }
    const hasEnoughCredits = checkCredits?.data?.userCredits ? checkCredits.data.fileCount! <= checkCredits.data.userCredits : true
  return (
    <div className='flex items-center gap-12 h-full justify-center'>
        <img src={'/logo.svg'} className='h-56 w-auto'/>
        <div>
            <div>
            <h1 className='font-semibold text-2xl'>
                Link your repository to get started.
            </h1>
            <p className='text-sm text-muted-foreground'>
                Enter your repository URL and project name.  
            </p>
            </div>
        <div className="h-4"></div>
        <div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input
                    {...register('projectName', { required: true })}
                    placeholder='Project Name'
                    required
                    >
                    </Input>
                    <div className="h-2"></div>
                    <Input
                    {...register('repoUrl', { required: true })}
                    placeholder='Repository URL'
                    type='url'
                    required
                    >
                    </Input>
                    <div className="h-2"></div>
                    <Input
                    {...register('githubToken')}
                    placeholder='Github Token (Optional)'
                    />
                    {!!checkCredits.data && (
                        <>
                            <div className='mt-4 bg-orange-50 px-4 py-2 rouneded-md border border-orange-200 text-orange-700'>
                                <div className='flex items-center gap-2'>
                                    <Info className='size-4' />
                                    <p className='text-sm'>You will be charged <strong>{checkCredits.data?.fileCount}</strong> credits for this repositories. </p>
                                </div>
                                <p className='text-sm text-gray-600 ml-6'>You have <strong>{checkCredits.data?.userCredits}</strong> credits remaining.</p>
                            </div>
                        </>
                    )}

                    <div className="h-4"></div>
                    {/* /*
                       loader - cp.ispending || checkCredits.isPending 
                       Create Project - hasEnoughCredits                     
                    */ }
                    <Button type='submit' disabled={createProject.isPending || checkCredits.isPending || !hasEnoughCredits}>
                    {createProject.isPending || checkCredits.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <p>This might take some time. Please hold on...</p>
                                </>
                            ) : (
                                !!checkCredits.data ? 'Create Project' : 'Check Credits'
                            )}
                    </Button>

                </form>
            </div>
        </div>
    </div>
  )
}

export default CreatePage