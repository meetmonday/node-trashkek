// 📦 Основной ответ сервера (GET /api/topics/:id/comments)
export interface MusorboxCommentsResponse {
  ok: boolean;
  items: MusorboxComment[];
}

// 📦 Ответ сервера с топиком (GET /api/topics/:id)
export interface MusorboxTopicResponse {
  ok: boolean;
  topic: MusorboxTopic;
}

// 📰 Тип топика
export interface MusorboxTopic {
  id: number;             // ID топика
  title: string;          // Заголовок топика
  slug: string;           // slug топика
  body: string;           // HTML-контент топика
}

// 💬 Тип комментария
export interface MusorboxComment {
  id: number;             // ID комментария
  topicId: number;        // ID топика
  parentId: number | null;
  body: string;           // HTML-контент
  votesUp: number;        // Плюсы
  votesDown: number;      // Минусы
  createdAt: string;      // Дата (ISO 8601)
  hidden: boolean;
  authorUsername: string; // Никнейм пользователя
  authorName: string;     // Отображаемое имя пользователя
}