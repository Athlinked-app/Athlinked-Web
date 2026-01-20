const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Lazy initialization function to ensure env vars are loaded
let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'athlinked-storage-23453';
    const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

    // Build S3 client configuration
    const s3Config = {
      region: AWS_REGION,
    };

    // Only add credentials if they are provided and not empty
    // This allows the SDK to use default credential chain (IAM roles, AWS CLI, etc.)
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

    if (accessKeyId && secretAccessKey && accessKeyId !== '' && secretAccessKey !== '') {
      s3Config.credentials = {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      };
      console.log('AWS credentials loaded from environment variables');
    } else {
      console.warn('AWS credentials not found in environment variables. Using default credential chain.');
      console.warn('Make sure AWS credentials are configured via:');
      console.warn('  - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
      console.warn('  - AWS credentials file (~/.aws/credentials)');
      console.warn('  - IAM role (if running on EC2/ECS/Lambda)');
    }

    // Initialize S3 client
    s3Client = new S3Client(s3Config);
  }
  return s3Client;
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'athlinked-storage-23453';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
// Presigned URL expiration time in seconds
// AWS S3 limitation: Maximum 7 days (604800 seconds)
// Default: 7 days (604800 seconds)
const PRESIGNED_URL_EXPIRATION = Math.min(
  parseInt(process.env.S3_PRESIGNED_URL_EXPIRATION || '604800', 10),
  604800 // Cap at 7 days (AWS maximum)
);

/**
 * Upload a file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name with path (S3 key)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} - S3 key (not presigned URL - store this in DB)
 */
async function uploadToS3(fileBuffer, fileName, contentType) {
  try {
    // Validate required configuration
    if (!BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured');
    }

    // Log configuration for debugging (without sensitive data)
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    console.log('S3 Upload Attempt:', {
      bucket: BUCKET_NAME,
      region: AWS_REGION,
      key: fileName,
      contentType: contentType,
      fileSize: fileBuffer.length,
      hasCredentials: !!(accessKeyId && secretAccessKey),
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      // Note: ACLs are disabled on this bucket (AWS security best practice)
      // Public access should be configured via bucket policy instead
    });

    await getS3Client().send(command);
    console.log('✓ File uploaded successfully to S3:', fileName);
    console.log('✓ Returning S3 key (not presigned URL) for database storage');
    
    // Return the S3 key instead of presigned URL
    // Presigned URLs will be generated when fetching
    return fileName;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    console.error('Error details:', {
      code: error.Code || error.code,
      message: error.message,
      name: error.name,
      bucket: BUCKET_NAME,
      region: AWS_REGION,
    });
    
    // Provide more helpful error messages
    if (error.name === 'CredentialsError' || error.message.includes('credential')) {
      throw new Error(`AWS credentials are invalid or not configured. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.`);
    } else if (error.name === 'NoSuchBucket') {
      throw new Error(`S3 bucket "${BUCKET_NAME}" does not exist or is not accessible.`);
    } else if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
      console.error('\n=== AccessDenied Error Details ===');
      console.error('This means your AWS credentials don\'t have permission to upload to S3.');
      console.error('\nTo fix this:');
      console.error('1. Go to AWS IAM Console → Users → Find the user with your Access Key');
      console.error('2. Add this IAM policy:');
      console.error(JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject', 's3:ListBucket'],
          Resource: [
            `arn:aws:s3:::${BUCKET_NAME}`,
            `arn:aws:s3:::${BUCKET_NAME}/*`
          ]
        }]
      }, null, 2));
      console.error('\n3. Verify bucket name matches:', BUCKET_NAME);
      console.error('4. Verify region matches:', AWS_REGION);
      console.error('===================================\n');
      throw new Error(`Access denied to S3 bucket "${BUCKET_NAME}". Your IAM user needs s3:PutObject permission. See console logs above for details.`);
    } else if (error.message.includes('ACL') || error.message.includes('does not allow ACLs')) {
      throw new Error(`S3 bucket "${BUCKET_NAME}" has ACLs disabled. Files will be uploaded but may require a bucket policy for public access.`);
    }
    
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Generate a presigned URL for an S3 object
 * @param {string} fileName - File name/key in S3
 * @param {number} expirationSeconds - Optional expiration time in seconds (defaults to PRESIGNED_URL_EXPIRATION, max 7 days)
 * @returns {Promise<string>} - Presigned URL
 */
async function generatePresignedUrl(fileName, expirationSeconds = PRESIGNED_URL_EXPIRATION) {
  try {
    // Extract the key from URL if full URL is provided
    let key = fileName;
    if (fileName.includes('amazonaws.com/')) {
      key = fileName.split('amazonaws.com/')[1];
      // Remove query parameters if present (from old presigned URLs)
      key = key.split('?')[0];
    } else if (fileName.startsWith('/')) {
      // Remove leading slash if present
      key = fileName.substring(1);
    }

    // Ensure expiration doesn't exceed AWS limit of 7 days (604800 seconds)
    const maxExpiration = 604800; // 7 days in seconds
    const validExpiration = Math.min(expirationSeconds, maxExpiration);

    if (expirationSeconds > maxExpiration) {
      console.warn(`Presigned URL expiration capped at 7 days (AWS limit). Requested: ${expirationSeconds}s, Using: ${validExpiration}s`);
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(getS3Client(), command, {
      expiresIn: validExpiration,
    });

    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

/**
 * Delete a file from S3
 * @param {string} fileName - File name/key in S3
 * @returns {Promise<void>}
 */
async function deleteFromS3(fileName) {
  try {
    // Extract the key from URL if full URL is provided
    let key = fileName;
    if (fileName.includes('amazonaws.com/')) {
      key = fileName.split('amazonaws.com/')[1];
    } else if (fileName.startsWith('/')) {
      // Remove leading slash if present
      key = fileName.substring(1);
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await getS3Client().send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
}

/**
 * Generate a unique file path for S3
 * @param {string} prefix - Prefix for the file (e.g., 'posts', 'messages', 'profile')
 * @param {string} originalName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @returns {string} - Generated file path
 */
function generateS3Key(prefix, originalName, mimeType) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  
  // Determine subfolder based on file type
  let subfolder = 'files';
  if (mimeType) {
    if (mimeType.startsWith('image/')) {
      subfolder = 'images';
    } else if (mimeType.startsWith('video/')) {
      subfolder = 'videos';
    } else if (mimeType === 'application/pdf') {
      subfolder = 'pdfs';
    }
  }

  return `${prefix}/${subfolder}/${prefix}-${uniqueSuffix}${ext}`;
}

/**
 * Convert S3 key to presigned URL if it's an S3 key
 * If it's already a presigned URL or not an S3 key, return as-is
 * @param {string} keyOrUrl - S3 key or existing URL
 * @param {number} expirationSeconds - Optional expiration time in seconds
 * @returns {Promise<string|null>} - Presigned URL or original value
 */
async function convertKeyToPresignedUrl(keyOrUrl, expirationSeconds = PRESIGNED_URL_EXPIRATION) {
  if (!keyOrUrl || typeof keyOrUrl !== 'string' || keyOrUrl.trim() === '') {
    return null;
  }

  // If it's already a presigned URL (contains amazonaws.com and has query params), return as-is
  if (keyOrUrl.includes('amazonaws.com') && keyOrUrl.includes('?')) {
    return keyOrUrl;
  }

  // If it's a relative path starting with /assets, return as-is (local asset)
  if (keyOrUrl.startsWith('/assets')) {
    return keyOrUrl;
  }

  // If it's a relative path starting with /, it might be an old local path
  // Check if it looks like an S3 key (contains /profile/, /posts/, etc.)
  if (keyOrUrl.startsWith('/')) {
    // Try to convert it - remove leading slash
    const key = keyOrUrl.substring(1);
    try {
      return await generatePresignedUrl(key, expirationSeconds);
    } catch (error) {
      console.warn('Failed to generate presigned URL for:', keyOrUrl, error.message);
      return keyOrUrl; // Return original if conversion fails
    }
  }

  // If it doesn't start with http and doesn't start with /, assume it's an S3 key
  if (!keyOrUrl.startsWith('http')) {
    try {
      return await generatePresignedUrl(keyOrUrl, expirationSeconds);
    } catch (error) {
      console.warn('Failed to generate presigned URL for:', keyOrUrl, error.message);
      return keyOrUrl; // Return original if conversion fails
    }
  }

  // If it starts with http but is not a presigned URL, return as-is
  return keyOrUrl;
}

/**
 * Convert multiple S3 keys to presigned URLs (batch processing)
 * @param {Array<string>} keysOrUrls - Array of S3 keys or URLs
 * @param {number} expirationSeconds - Optional expiration time in seconds
 * @returns {Promise<Array<string|null>>} - Array of presigned URLs or original values
 */
async function convertKeysToPresignedUrls(keysOrUrls, expirationSeconds = PRESIGNED_URL_EXPIRATION) {
  if (!Array.isArray(keysOrUrls)) {
    return [];
  }

  return Promise.all(
    keysOrUrls.map(keyOrUrl => convertKeyToPresignedUrl(keyOrUrl, expirationSeconds))
  );
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  generateS3Key,
  generatePresignedUrl,
  convertKeyToPresignedUrl,
  convertKeysToPresignedUrls,
  BUCKET_NAME,
  PRESIGNED_URL_EXPIRATION,
};
