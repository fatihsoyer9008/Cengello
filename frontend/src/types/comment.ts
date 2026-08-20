export interface Comment {
  id: string;
  body: string;
  card_id: string;
  author_id: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentCreate {
  body: string;
  card_id: string;
}

export interface CommentUpdate {
  body: string;
}
