export interface BoardList {
  id: string;
  name: string;
  board_id: string;
  position: number;
  is_archived: boolean;
}

export interface ListCreate {
  name: string;
  board_id: string;
}

export interface ListUpdate {
  name?: string;
  is_archived?: boolean;
}

export interface MoveListRequest {
  before_id?: string | null;
  after_id?: string | null;
}

export interface MoveListResponse {
  list: BoardList;
  rebalanced: boolean;
}
