from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.chat import ChatSession, ChatMessage
from app.models.paper import Paper
from app.agents.research_agent import get_research_agent
from app.agents.summarizer_agent import get_summarizer_agent
from app.agents.citation_agent import get_citation_agent
from app.schemas.chat import CitationItem

class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.research_agent = get_research_agent()
        self.summarizer_agent = get_summarizer_agent()
        self.citation_agent = get_citation_agent()

    def create_session(self, user_id: int, paper_id: Optional[int] = None, title: Optional[str] = "New Conversation") -> ChatSession:
        """Initialize a new chat conversation."""
        if paper_id:
            paper = self.db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
            if not paper:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced paper not found")
            if not title or title == "New Conversation":
                title = f"Discussion: {paper.title[:40]}"

        session = ChatSession(
            user_id=user_id,
            paper_id=paper_id,
            title=title or "New Conversation"
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_sessions(self, user_id: int, paper_id: Optional[int] = None) -> List[ChatSession]:
        """Fetch chat sessions for a user, optionally filtered by paper."""
        query = self.db.query(ChatSession).filter(ChatSession.user_id == user_id)
        if paper_id:
            query = query.filter(ChatSession.paper_id == paper_id)
        return query.order_by(ChatSession.updated_at.desc()).all()

    def get_session(self, session_id: int, user_id: int) -> ChatSession:
        """Fetch session by ID with ownership check."""
        session = self.db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        ).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
        return session

    async def send_message(
        self,
        session_id: int,
        user_id: int,
        query: str,
        agent_mode: str = "research"
    ) -> ChatMessage:
        """Process a user query through the designated agent and store conversation turns."""
        session = self.get_session(session_id, user_id)

        # 1. Record user question
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=query,
            agent_used=agent_mode
        )
        self.db.add(user_msg)
        self.db.commit()

        # 2. Reconstruct recent conversation context
        history_msgs = (
            self.db.query(ChatMessage)
            .filter(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        formatted_history = [
            {"role": m.role, "content": m.content} for m in history_msgs[:-1]
        ]

        # 3. Invoke specialized agent
        if agent_mode == "citation" and session.paper_id:
            paper = self.db.query(Paper).filter(Paper.id == session.paper_id).first()
            citations_dict = self.citation_agent.format_all(
                title=paper.title if paper else "Paper",
                authors=paper.authors if paper else "",
                year=paper.year if paper else 2024
            )
            reply_text = (
                f"### Formatted Citations\n\n"
                f"**BibTeX:**\n```bibtex\n{citations_dict['bibtex']}\n```\n\n"
                f"**APA:**\n{citations_dict['apa']}\n\n"
                f"**IEEE:**\n{citations_dict['ieee']}"
            )
            citations_data = []
        else:
            agent_res = await self.research_agent.answer_query(
                query=query,
                paper_id=session.paper_id,
                conversation_history=formatted_history
            )
            reply_text = agent_res["answer"]
            citations_list: List[CitationItem] = agent_res.get("citations", [])
            citations_data = [c.dict() for c in citations_list]

        # 4. Save assistant response
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=reply_text,
            agent_used=agent_mode,
            citations_data=citations_data
        )
        self.db.add(assistant_msg)
        self.db.commit()
        self.db.refresh(assistant_msg)

        return assistant_msg
