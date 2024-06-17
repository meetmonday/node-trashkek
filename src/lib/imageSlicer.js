const sharp = require('sharp');
const fs = require('fs');

// Задайте путь к вашему исходному изображению
const inputImagePath = 'path/to/your/image.jpg';
const outputDirectory = 'output/'; // Директория для сохранения нарезанных частей

// Убедитесь, что выходная директория существует
if (!fs.existsSync(outputDirectory)){
    fs.mkdirSync(outputDirectory);
}

// Функция для нарезки изображения
async function sliceImage(imagePath, outputDir) {
    try {
        // Загрузите изображение и получите его метаданные
        const image = sharp(imagePath);
        const metadata = await image.metadata();

        // Размеры исходного изображения
        const { width, height } = metadata;

        // Размеры каждой части
        const halfWidth = Math.floor(width / 2);
        const halfHeight = Math.floor(height / 2);

        // Координаты для нарезки (x, y, width, height)
        const regions = [
            { left: 0, top: 0, width: halfWidth, height: halfHeight }, // Верхний левый угол
            { left: halfWidth, top: 0, width: halfWidth, height: halfHeight }, // Верхний правый угол
            { left: 0, top: halfHeight, width: halfWidth, height: halfHeight }, // Нижний левый угол
            { left: halfWidth, top: halfHeight, width: halfWidth, height: halfHeight } // Нижний правый угол
        ];

        // Нарезка и сохранение частей
        for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            await image
                .extract(region)
                .toFile(`${outputDir}part${i + 1}.jpg`);
        }

        console.log('Изображение успешно нарезано на четыре части.');
    } catch (error) {
        console.error('Ошибка при нарезке изображения:', error);
    }
}

// Вызов функции нарезки
sliceImage(inputImagePath, outputDirectory);