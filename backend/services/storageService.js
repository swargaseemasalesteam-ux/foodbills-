const path = require('path');
const fs = require('fs');

const storageService = {
  getPublicUrl(filename) {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    return `/uploads/screenshots/${path.basename(filename)}`;
  },

  getFilePath(filename) {
    if (!filename) return null;
    const base = path.basename(filename);
    return path.join(__dirname, '../uploads/screenshots', base);
  },

  deleteFile(filename) {
    const filePath = this.getFilePath(filename);
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      }
    }
    return false;
  }
};

module.exports = storageService;
