from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatHistoryResponse,
)
from app.services.chat_service import ChatService
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    session_in: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new chat session for a paper or open research conversation."""
    service = ChatService(db)
    return service.create_session(
        user_id=current_user.id,
        paper_id=session_in.paper_id,
        title=session_in.title
    )

@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_chat_sessions(
    paper_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List conversations for current user."""
    service = ChatService(db)
    return service.get_sessions(user_id=current_user.id, paper_id=paper_id)

@router.get("/sessions/{session_id}", response_model=ChatHistoryResponse)
def get_chat_session_history(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch complete conversation history for a session."""
    service = ChatService(db)
    session = service.get_session(session_id=session_id, user_id=current_user.id)
    
    # Format messages
    formatted_messages = []
    for msg in session.messages:
        citations = msg.citations_data or []
        formatted_messages.append(ChatMessageResponse(
            id=msg.id,
            session_id=msg.session_id,
            role=msg.role,
            content=msg.content,
            agent_used=msg.agent_used,
            citations=citations,
            created_at=msg.created_at
        ))

    return ChatHistoryResponse(
        session=ChatSessionResponse.model_validate(session),
        messages=formatted_messages
    )

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_chat_message(
    session_id: int,
    message_in: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send query to the selected agent (research, summarizer, citation) and receive grounded answer."""
    service = ChatService(db)
    msg = await service.send_message(
        session_id=session_id,
        user_id=current_user.id,
        query=message_in.query,
        agent_mode=message_in.agent_mode or "research"
    )

    return ChatMessageResponse(
        id=msg.id,
        session_id=msg.session_id,
        role=msg.role,
        content=msg.content,
        agent_used=msg.agent_used,
        citations=msg.citations_data or [],
        created_at=msg.created_at
    )
