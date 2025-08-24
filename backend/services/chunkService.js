const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ChunkService {
  constructor() {
    this.baseStorageDir = path.join(__dirname, '..', 'temp', 'chunks');
    this.ensureStorageDir();
  }

  async ensureStorageDir() {
    try {
      await fs.mkdir(this.baseStorageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  async saveChunkToDisk(interviewId, chunkIndex, data) {
    try {
      if (!data || data.length === 0) {
        return false;
      }

      const storageDir = path.join(this.baseStorageDir, interviewId);
      await fs.mkdir(storageDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const chunkFileName = `chunk-${chunkIndex}-${timestamp}.webm`;
      const chunkFilePath = path.join(storageDir, chunkFileName);

      // Write chunk data to disk
      await fs.writeFile(chunkFilePath, data);

      // Get file stats
      const stats = await fs.stat(chunkFilePath);

      return {
        success: true,
        filePath: chunkFilePath,
        fileName: chunkFileName,
        size: stats.size,
        chunkIndex: parseInt(chunkIndex)
      };

    } catch (error) {
      console.error('Save chunk error:', error);
      throw new Error(`Failed to save chunk: ${error.message}`);
    }
  }

  async combineChunks(interviewId, totalChunks) {
    try {
      const storageDir = path.join(this.baseStorageDir, interviewId);
      const outputFileName = `interview-${interviewId}-${Date.now()}.webm`;
      const outputPath = path.join(storageDir, outputFileName);

      // Read all chunk files and combine
      const chunks = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkFiles = await fs.readdir(storageDir);
        const chunkFile = chunkFiles.find(file => file.startsWith(`chunk-${i}-`));
        
        if (chunkFile) {
          const chunkPath = path.join(storageDir, chunkFile);
          const chunkData = await fs.readFile(chunkPath);
          chunks.push(chunkData);
        }
      }

      // Combine all chunks into single file
      const combinedData = Buffer.concat(chunks);
      await fs.writeFile(outputPath, combinedData);

      // Get final file stats
      const stats = await fs.stat(outputPath);

      // Cleanup chunk files
      await this.cleanupChunks(storageDir);

      return {
        success: true,
        filePath: outputPath,
        fileName: outputFileName,
        size: stats.size
      };

    } catch (error) {
      console.error('Combine chunks error:', error);
      throw new Error(`Failed to combine chunks: ${error.message}`);
    }
  }

  async cleanupChunks(storageDir) {
    try {
      const files = await fs.readdir(storageDir);
      const chunkFiles = files.filter(file => file.startsWith('chunk-'));
      
      for (const file of chunkFiles) {
        await fs.unlink(path.join(storageDir, file));
      }
    } catch (error) {
      console.error('Cleanup chunks error:', error);
    }
  }

  async getInterviewChunks(interviewId) {
    try {
      const storageDir = path.join(this.baseStorageDir, interviewId);
      const files = await fs.readdir(storageDir);
      const chunkFiles = files.filter(file => file.startsWith('chunk-'));
      
      return chunkFiles.map(file => {
        const chunkIndex = parseInt(file.split('-')[1]);
        return {
          fileName: file,
          chunkIndex,
          filePath: path.join(storageDir, file)
        };
      }).sort((a, b) => a.chunkIndex - b.chunkIndex);
    } catch (error) {
      console.error('Get interview chunks error:', error);
      return [];
    }
  }

  async deleteInterviewChunks(interviewId) {
    try {
      const storageDir = path.join(this.baseStorageDir, interviewId);
      await fs.rmdir(storageDir, { recursive: true });
      return true;
    } catch (error) {
      console.error('Delete chunks error:', error);
      return false;
    }
  }
}

module.exports = new ChunkService();