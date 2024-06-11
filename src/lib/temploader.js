import fs from 'fs';
import path from 'path';
import axios from 'axios';

const __dirname = path.resolve();
// Функция для загрузки файла по URL в папку .temp с случайным именем и возвращает путь к файлу
async function downloadFile(url) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const tempDir = path.join(__dirname, '.temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const randomName = Math.random().toString(36).substring(7);
    const filePath = path.join(tempDir, randomName);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    // console.error('Error downloading file:', error);
    // throw error;
  }
}

// Функция для удаления файла из папки .temp
function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    // console.log('File deleted successfully');
  } catch (error) {
    // console.error('Error deleting file:', error);
    throw error;
  }
}

export default { downloadFile, deleteFile };
