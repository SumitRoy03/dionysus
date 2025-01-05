'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import { on } from 'events';
import Image from 'next/image'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner';


type FormInput = {
    repoUrl : string,
    projectName : string,
    githubToken? : string,
}

const CreatePage = () => {

    const { register, handleSubmit, reset} = useForm<FormInput>()
    const createProject  = api.project.createProject.useMutation();
    const refetch = useRefetch();

    function onSubmit(data: FormInput) {
        // console.log(data);
        createProject.mutate({
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

        return true;
    }

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
                    >
                    </Input>
                    <div className="h-4"></div>
                    <Button type='submit' disabled={createProject.isPending}>Create</Button>

                </form>
            </div>
        </div>
    </div>
  )
}

export default CreatePage