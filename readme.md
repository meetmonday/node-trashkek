# node-trashkek 2
Постироничный бот для телеграма с использованием лишних библиотек

теперь опенсорц!!!!!!

# Запуск бота
- ``` npm run dev ``` для запуска на машине (там переменные из .енв)
- ``` npm run start ``` для запуска на продакшоне

По умолчанию запускается на ```PORT``` либо ```:8080```

# Запуск бота в ~~мусорном~~ контейнере

Скопируйте файл [.env.example](.env.example) как `.env`, измените необходимые переменные из раздела [конфигурация](#конфигурация).

Для упрощённого запуска и управления состоянием Docker приложения используйте утилиту [Make](https://www.gnu.org/software/make/).

Запуск приложения с использованием Make возможен с помощью команды
```shell
make run
```

Приложение будет работать в режиме для инвалидов

# Конфигурация
Подтягивается из env машины или из файла .env (если run dev)
## Описание параметров 
- ```BOT_TOKEN``` - токен бота
- ```HENTAI_PROXY``` - ссылка на хттп прокси для работы модуля хентая
- ```HENTAI_PORT``` - порт прокси
- ```WH_URL``` - урл, куда будет ставиться вебхук (автоматом!!!)
- также можно указать ```PORT``` для запуска сервера на любом порте
- ```OPENAI_API_KEY``` - токен для работы чятжпт-специфичных функций
