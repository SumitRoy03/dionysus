import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import useProject from '@/hooks/use-project'
import { DialogTitle } from '@radix-ui/react-dialog'
import { Copy } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

const InviteButton = () => {
    const { projectId } = useProject();
    const [open, setOpen] = React.useState(false)
  return (
    <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Team Members</DialogTitle>
                </DialogHeader>
                <p className='text-sm text-gray-500'>
                    Click below to copy the link
                </p>
                <div className="relative flex items-center max-w-2xl ">
                    <Input
                        value={`${window.location.origin}/join/${projectId}`}
                        readOnly
                        className=" pr-8"
                    />
                    <Button variant='outline' className='ml-2' onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/join/${projectId}`)
                        toast.success('Copied to clipboard')
                    }}>
                        <Copy className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
        <Button size='sm' onClick={() => setOpen(true)}>Invite Members</Button>
    </>
  )
}

export default InviteButton