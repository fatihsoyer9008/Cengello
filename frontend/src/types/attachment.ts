export interface Attachment {
  id: string;
  card_id: string;
  uploaded_by: string;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  created_at: string;
}
