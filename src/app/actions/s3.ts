'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@clerk/nextjs/server'

import {  getSignedUrl  } from '@aws-sdk/s3-request-presigner'

import crypto from 'crypto';
const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const s3 = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
})

const signedUrl = async () => {
    const session = await auth();
    if(!session) {
        return {
            failure: "Not authenticated"
        }
    }
    const fileKey = generateFileName(); // Generate the file key

    const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileKey,

    })

    const Url = getSignedUrl(s3,putObjectCommand, {
        expiresIn: 300
    });
    const bucketUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileKey}`;


    return {
        success:{
            url: Url,
            bucketUrl
        }
    }
}

export default signedUrl