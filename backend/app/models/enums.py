import enum


class WorkspaceRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class BoardRole(str, enum.Enum):
    admin = "admin"
    member = "member"
    viewer = "viewer"


class CustomFieldType(str, enum.Enum):
    text = "text"
    number = "number"
    dropdown = "dropdown"
    checkbox = "checkbox"
    date = "date"


class TemplateScope(str, enum.Enum):
    board = "board"
    card = "card"
