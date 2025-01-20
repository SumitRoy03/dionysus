'use client'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import useProject from '@/hooks/use-project'
import Image from 'next/image';
import React from 'react'
import { askQuestion } from './actions';
import { readStreamableValue } from 'ai/rsc';
import MDEditor from '@uiw/react-md-editor'
import CodeReferences from './code-references';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import useRefetch from '@/hooks/use-refetch';


const AskQuestionCard = () => {

    const {project}  = useProject();
    const [question, setQuestion] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [fileReferences, setFileReferences] = React.useState<{fileName:string, sourceCode:string, summary:string}[]>()
    const [answer, setAnswer] = React.useState('')
    const [_q, setQ] = React.useState('');
    const saveAnswer = api.project.saveAnswer.useMutation();

    const refetch = useRefetch();

    const onSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
        setQuestion('')
        setAnswer('')
        setFileReferences([]);
        e.preventDefault();
        if(!project?.id) return
        setLoading(true);
        
        const { output, fileReferences } = await askQuestion(question, project.id)
        setOpen(true);
        setFileReferences(fileReferences)

        for await (const delta of readStreamableValue(output)) {
            if(delta) {
                setAnswer(ans => ans + delta)
            }
        }
        setLoading(false);
    }

  return (
    <>
    <Dialog open = {open} onOpenChange={setOpen}  >
        <DialogContent className='sm:max-w-[80vw]'>
            <DialogHeader>
                <div className="flex items-center gap-2">
                    <DialogTitle>
                        <Image src='/logo.svg' alt='logo' width={40} height={40} />
                    </DialogTitle>
                    <Button variant='outline' disabled={saveAnswer.isPending} onClick={() => {
                        saveAnswer.mutate({
                            projectId: project!.id,
                            question : _q,
                            answer,
                            fileReferences
                        }, {
                            onSuccess : () => {
                                toast.success('Answer saved!')
                                refetch();
                            },
                            
                            onError : () => {
                                toast.error('Failed to save the answer!')
                            }
                        })
                    }}>
                        Save Answer
                    </Button>
                </div>
            </DialogHeader>

            <MDEditor.Markdown source={answer} className='max-w-[70vw] !h-full max-h-[40vh] overflow-scroll' />
            <CodeReferences fileReferences={fileReferences || []} />
            <Button type='button' onClick={() => setOpen(false)}>
                Close
            </Button>
            
        </DialogContent>
    </Dialog>
        <Card className='relative col-span-3'>
            <CardHeader>
                <CardTitle>Ask a Question</CardTitle>
                <CardContent>
                    <form onSubmit={onSubmit}>
                        <Textarea placeholder='Which file should i edit to see the homepage?'
                         value={question}
                         onChange={e => {
                            setQuestion(e.target.value)
                            setQ(e.target.value)
                         }
                        } />
                        <div className="h-4"></div>
                        <Button type='submit' disabled={loading}>
                            Ask Dionysus!
                        </Button>
                    </form>
                </CardContent>   
            </CardHeader>
        </Card>
    </>
  )
}

export default AskQuestionCard
