export interface ImageInfo {
  height: number;
  uri: string;
  url_list: string[];
  url_prefix: string | null;
  width: number;
}

export interface AnchorAction {
  action_type: number;
  icon: ImageInfo;
  schema: string;
}

export interface Anchor {
  actions: AnchorAction[];
  anchor_strong: string | null;
  component_key: string;
  description: string;
  extra: string; // ⚠️ JSON-строка
  general_type?: number;
  icon: ImageInfo;
  id: string;
  keyword: string;
  log_extra: string; // ⚠️ JSON-строка
  schema: string;
  thumbnail: ImageInfo;
  type: number;
}

export interface MusicInfo {
  id: string;
  title: string;
  play: string;
  author: string;
  original: boolean;
  duration: number;
  album: string;
}

export interface CommerceInfo {
  adv_promotable: boolean;
  auction_ad_invited: boolean;
  branded_content_type: number;
  is_diversion_ad: number;
  organic_log_extra: string; // ⚠️ JSON-строка
  with_comment_filter_words: boolean;
}

export interface Author {
  id: string;
  unique_id: string;
  nickname: string;
  avatar: string;
}

// Универсальный интерфейс для видео и фото
export interface TikTokMediaData {
  id: string;
  region: string;
  title: string;
  content_desc: string[];
  cover: string;
  duration: number; // У фото = 0
  play: string;
  wmplay: string;
  hdplay: string;
  size: number; // У фото = 0
  wm_size: number;
  hd_size: number;
  music: string;
  music_info: MusicInfo;
  play_count: number;
  digg_count: number;
  comment_count: number;
  share_count: number;
  download_count: number;
  collect_count: number;
  create_time: number;
  anchors: Anchor[] | null; // ⚠️ Для фото-постов часто приходит null
  anchors_extras: string;
  is_ad: boolean;
  commerce_info: CommerceInfo;
  commercial_video_info: string;
  item_comment_settings: number;
  mentioned_users: string;
  author: Author;
  images?: string[]; // ⚠️ Присутствует только в фото-каруселях
}

export interface TikTokApiResponse {
  code: number;
  msg: string;
  processed_time: number;
  data: TikTokMediaData;
}