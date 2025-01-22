'use client'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Presentation, Upload } from 'lucide-react';
import React from 'react'
import {  useDropzone  } from 'react-dropzone'
import signedUrl from '@/app/actions/s3'
import CustomCircularProgress from '@/app/_components/CustomCircularProgress';


const MeetingCard = () => {
    const [isUploading, setIsUploading] = React.useState(false)
    const [progress, setProgress] = React.useState(0);
    const [fileUrl, setFileUrl] = React.useState('');

    const uploadFile = async (url: string, file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded * 100) / event.total);
                    setProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`HTTP Error: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('PUT', url);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept : {
            'audio/*' : ['.mp3', '.wav', '.m4a']
        },
        multiple: false,
        maxSize: 50_000_000,
        onDrop: async acceptedFiles => {
            try {
                setIsUploading(true);
                setProgress(0);
                
                if (!acceptedFiles || acceptedFiles.length === 0) {
                    throw new Error('No file selected');
                }

                const file = acceptedFiles[0]!;
                const response = await signedUrl();

                if (!response || !response.success?.url) {
                    throw new Error('Failed to get upload URL');
                }

                const uploadUrl = await response.success.url;

                const downloadUrl = await response.success.bucketUrl;
                console.log(downloadUrl);
                const s3Response = await uploadFile(uploadUrl, file);
                console.log(s3Response);
                
                console.log('Upload completed successfully');

            } catch (error) {
                console.error('Error during upload:', error);
                setProgress(0);
            } finally {
                setIsUploading(false);
            }
            // const downloadUrl = await uploadFile(file as File, setProgress);
            // const downloadUrl = await uploadFile(file as File)
            // window.alert(downloadUrl)
            setIsUploading(false);


        }
    });
  return (
    <Card className='col-span-2 flex flex-col items-center justify-center p-10' {...getRootProps()}>
        {!isUploading && (
            <>
                <Presentation className='h-10 w-10 animate-bounce' />
                <h3 className='mt-2 text-sm font-semibold text-gray-900'>
                    Create a new meeting
                </h3>
                <p className='mt-1 text-center text-sm text-gray-500'>
                    Analyse your meeting with Dionysus
                    <br/>
                    Powered by AI 
                </p>
                <div className="mt-6">
                    <Button disabled = {isUploading}>
                        <Upload className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden="true" />
                        Upload Meeting
                        <input className='hidden' {...getInputProps()}/>
                    </Button>
                </div>
            </>
        )}
        {isUploading && (
             <div className="flex flex-col items-center justify-center space-y-4">
             <CustomCircularProgress progress={progress} />
             <p className="text-sm text-gray-500">Uploading your meeting...</p>
           </div>
        )}
    </Card>
  )
}

export default MeetingCard