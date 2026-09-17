// 📦 Основной ответ сервера (GET /api/topics/:id/comments)
export interface MusorboxCommentsResponse {
  ok: boolean;
  items: MusorboxComment[];
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