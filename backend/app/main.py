from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    activity,
    attachments,
    auth,
    automation_rules,
    boards,
    cards,
    checklists,
    comments,
    custom_fields,
    labels,
    lists,
    templates,
    users,
    workspaces,
)

app = FastAPI(title="Cengello API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(workspaces.router)
app.include_router(boards.router)
app.include_router(lists.router)
app.include_router(cards.router)
app.include_router(labels.router)
app.include_router(checklists.router)
app.include_router(custom_fields.router)
app.include_router(attachments.router)
app.include_router(comments.router)
app.include_router(activity.router)
app.include_router(automation_rules.router)
app.include_router(templates.router)
