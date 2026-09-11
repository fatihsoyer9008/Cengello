from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints


SuggestionText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


class CardSuggestions(BaseModel):
    summary: SuggestionText
    steps: list[SuggestionText] = Field(min_length=1, max_length=8)
    considerations: list[SuggestionText] = Field(max_length=5)
