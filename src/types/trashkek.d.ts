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
  br: string;             // Флаг (вероятно, "0"/"1")
  medal_id: string;       // ID медали
  good_medals: string;    // Количество "+" (строка)
  bad_medals: string;     // Количество "-" (строка)
  votes: string;          // Общий рейтинг (может быть отрицательным, строка)
  votes0: string;         // Голоса "против" (строка)
  votes1: string;         // Голоса "за" (строка)
  elite: string;          // Флаг элиты
  elite2: string;         // Доп. флаг элиты
}