import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
const __dirname = path.resolve();

/**
 * Функция для создания слайдшоу из изображений и аудио.
 * @param {string[]} imageUrls - Массив ссылок на изображения.
 * @param {string} audioUrl - Ссылка на аудиофайл.
 * @param {string} outputFilePath - Путь для сохранения итогового видео.
 * @returns {Promise<string>} Путь к созданному видео.
 */
async function createSlideshow(imageUrls, audioUrl, outputFilePath) {
  try {
    // Задаем путь к временной директории в корне проекта
    const tempDir = path.join(path.resolve(), '.temp', 'vid');

    // Создаем временную директорию и её родительские директории, если они не существуют
    fs.mkdirSync(tempDir, { recursive: true });

    // Функция для загрузки файла по URL
    const downloadFile = async (url, filepath) => {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    };

    // Загрузка изображений
    const imagePaths = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const imagePath = path.join(tempDir, `${i + 1}.jpg`);
      await downloadFile(imageUrl, imagePath);
      imagePaths.push(imagePath);
    }

    // Загрузка аудио
    let audioPath = path.join(tempDir, 'background.mp3');
    await downloadFile(audioUrl, audioPath);

    // Получаем длительность аудиофайла
    const getAudioDuration = async (audioPath) => {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
          if (err) return reject(err);
          const duration = metadata.format.duration;
          resolve(duration);
        });
      });
    };

    const audioDuration = await getAudioDuration(audioPath);

    // Минимальная и максимальная длина каждого слайда в секундах
    const minSlideDuration = 2; // минимальная длительность одного слайда
    const maxSlideDuration = 6; // максимальная длительность одного слайда

    // Рассчитываем длительность каждого слайда
    let slideDuration = audioDuration / imageUrls.length;

    if (slideDuration < minSlideDuration) {
      // Если длина слайда меньше минимальной, повторяем аудио
      const repeatFactor = Math.ceil(minSlideDuration * imageUrls.length / audioDuration);
      const repeatedAudioPath = path.join(tempDir, 'repeated_audio.mp3');
      
      await new Promise((resolve, reject) => {
        ffmpeg(audioPath)
          .outputOptions([
            '-filter_complex', `aloop=loop=${repeatFactor}:size=1e+06` // Повторение аудио
          ])
          .on('end', resolve)
          .on('error', reject)
          .save(repeatedAudioPath);
      });

      // Обновляем путь к аудио на повторенный файл
      audioPath = repeatedAudioPath;

      // Устанавливаем новую длительность слайда
      slideDuration = minSlideDuration;

    } else if (slideDuration > maxSlideDuration) {
      // Если длина слайда больше максимальной, уменьшаем число слайдов путем повтора
      slideDuration = maxSlideDuration;
      const totalVideoDuration = maxSlideDuration * imageUrls.length;
      
      // Повторяем изображения для заполнения времени
      const repeatedImages = [];
      let currentDuration = 0;
      while (currentDuration < totalVideoDuration) {
        repeatedImages.push(...imagePaths);
        currentDuration += maxSlideDuration * imagePaths.length;
      }
      
      // Обновляем список изображений для создания видео
      imagePaths.length = 0;
      imagePaths.push(...repeatedImages.slice(0, Math.ceil(totalVideoDuration / maxSlideDuration)));
    }

    return new Promise((resolve, reject) => {
      // Настройка и запуск FFmpeg для создания слайдшоу
      ffmpeg()
        .addInput(`${tempDir}/%d.jpg`) // %d будет заменен на числа (1.jpg, 2.jpg и т.д.)
        .inputOptions([
          `-framerate ${1 / slideDuration}`, // Рассчитанный кадр в секунду для слайда
          '-pattern_type sequence' // Использование последовательности файлов
        ])
        .input(audioPath)
        .outputOptions([
          '-c:v libx264', // Использование кодека x264
          '-pix_fmt yuv420p', // Совместимость с большинством видеоплееров
          '-g 30', // Установка интервала ключевых кадров (каждые 30 кадров)
          '-movflags +faststart', // Для оптимизации при воспроизведении
          '-shortest' // Обрезать видео до длины аудиофайла
        ])
        .on('end', () => {
          // Удаление временных файлов
          fs.rmSync(tempDir, { recursive: true, force: true });
          resolve(outputFilePath);
        })
        .on('error', (err) => {
          // Удаление временных файлов в случае ошибки
          fs.rmSync(tempDir, { recursive: true, force: true });
          reject(`Произошла ошибка: ${err.message}`);
        })
        .save(outputFilePath);
    });
  } catch (error) {
    throw new Error(`Произошла ошибка: ${error.message}`);
  }
}

export default createSlideshow;