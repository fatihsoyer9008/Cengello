export interface InboxItem {
  id: string;
  text: string;
  created_at: string;
}

export interface InboxItemCreate {
  text: string;
}
