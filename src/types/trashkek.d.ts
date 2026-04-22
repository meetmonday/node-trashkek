// 📦 Основной ответ сервера
export interface CommentsResponse {
  comments: Comment[];
}

// 💬 Тип комментария
export interface Comment {
  comm_id: string;        // ID комментария (строка)
  parent: string;         // ID родителя ("0" = топ-уровень)
  content: string;        // HTML-контент (может содержать <img>, <iframe>, <strong> и т.д.)
  login: string;          // Никнейм пользователя
  avatar: string;         // Идентификатор аватара
  posted: string;         // Unix-таймстемп в виде строки
  br: string;             // Прикол
  medal_id: string;       // ID ачивки
  good_medals: string;    // Количество синих ач (строка)
  bad_medals: string;     // Количество красных ач (строка)
  votes: string;          // Общий рейтинг камента
  votes0: string;         // Минусы (строка)
  votes1: string;         // Плюсы (строка)
  elite: string;          // Флаг элиты (не используется)
  elite2: string;         // Доп. флаг элиты (не используется)
}