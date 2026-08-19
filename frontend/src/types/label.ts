export interface Label {
  id: string;
  name: string;
  color: string;
  board_id: string;
}

export interface LabelCreate {
  name?: string;
  color: string;
  board_id: string;
}

export interface LabelUpdate {
  name?: string;
  color?: string;
}
