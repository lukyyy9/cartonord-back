import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create S3 service object
const s3 = new AWS.S3();

// Bucket name
const bucketName = process.env.S3_BUCKET_NAME || 'cartonord-files';

/**
 * Generate a presigned URL for uploading a file to S3
 * @param key - The file key (path) in the S3 bucket
 * @param contentType - The content type of the file
 * @param expiresIn - The number of seconds until the presigned URL expires
 * @returns The presigned URL
 */
const generatePresignedUploadUrl = (
  key: string,
  contentType: string,
  expiresIn: number = 300 // 5 minutes by default
): Promise<string> => {
  const params = {
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn,
  };

  return new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', params, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
};

/**
 * Generate a presigned URL for getting a file from S3
 * @param key - The file key (path) in the S3 bucket
 * @param expiresIn - The number of seconds until the presigned URL expires
 * @returns The presigned URL
 */
const generatePresignedGetUrl = (
  key: string,
  expiresIn: number = 3600 // 1 hour by default
): Promise<string> => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: expiresIn,
  };

  return new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
};

export { s3, bucketName, generatePresignedUploadUrl, generatePresignedGetUrl }; 