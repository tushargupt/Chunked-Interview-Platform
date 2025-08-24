const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucketName = process.env.S3_BUCKET_NAME;
  }

  async uploadRecording(filePath, interviewId) {
    try {
      const fileName = path.basename(filePath);
      const s3Key = `recordings/${interviewId}/${fileName}`;
      
      // Read file data
      const fileData = fs.readFileSync(filePath);
      
      const params = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileData,
        ContentType: 'video/webm',
        ContentDisposition: 'attachment',
        Metadata: {
          'interview-id': interviewId,
          'upload-timestamp': new Date().toISOString()
        }
      };

      const result = await this.s3.upload(params).promise();
      
      return {
        success: true,
        s3Key,
        url: result.Location,
        etag: result.ETag
      };

    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  async generateDownloadUrl(s3Key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: s3Key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('Generate download URL error:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  async deleteRecording(s3Key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: s3Key
      };

      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('S3 Delete Error:', error);
      return false;
    }
  }

  async checkBucketAccess() {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      return true;
    } catch (error) {
      console.error('S3 Bucket Access Error:', error);
      return false;
    }
  }
}

module.exports = new S3Service();