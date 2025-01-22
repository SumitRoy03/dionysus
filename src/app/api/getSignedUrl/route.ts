import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1',
});

export async function POST(req: NextRequest) {
    const { fileName, fileType, keyPrefix } = await req.json();
    console.log(fileName, fileType, keyPrefix)

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: `${keyPrefix ?? ''}${fileName}`,
        ContentType: fileType,
        ACL: 'public-read',
    };

    try {
        const signedUrl = await s3.getSignedUrlPromise('putObject', params);
        return NextResponse.json({ signedUrl });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }
}
