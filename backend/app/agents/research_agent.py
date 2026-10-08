import logging
from typing import Dict, Any, List, Optional
from app.llm.llm_service import LLMService, get_llm_service
from app.rag.retriever import RAGRetriever, get_retriever
from app.schemas.chat import CitationItem

logger = logging.getLogger("papermind.agents.research")

RESEARCH_SYSTEM_PROMPT = """You are PaperMind's Senior Scientific Research Agent.
Your job is to provide deep, rigorous, objective, and evidence-grounded answers based strictly on the provided research paper context.

Guidelines:
1. Ground every claim directly in the excerpts provided in the context.
2. When referencing specific findings or formulas, cite the corresponding page number (e.g., "[Page 4]").
3. If the paper excerpts do not contain enough information to address a specific aspect of the question, explicitly state what is missing rather than inventing facts.
4. Structure complex answers logically with clear headings, bullet points, and concise mathematical or technical explanations.
"""

class ResearchAgent:
    """Agent specializing in deep academic paper analysis, RAG synthesis, and contextual reasoning."""

    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
        retriever: Optional[RAGRetriever] = None
    ):
        self.llm = llm_service or get_llm_service()
        self.retriever = retriever or get_retriever()

    async def answer_query(
        self,
        query: str,
        paper_id: Optional[int] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Perform multi-stage retrieval and synthesize an evidence-backed answer."""
        # 1. Retrieve most relevant context chunks
        retrieved_chunks = self.retriever.retrieve(
            query=query,
            paper_id=paper_id,
            top_k=5
        )

        context_str = self.retriever.build_context(retrieved_chunks)
        citations: List[CitationItem] = self.retriever.extract_citations(retrieved_chunks)

        # 2. Build conversation history and context
        messages = [{"role": "system", "content": RESEARCH_SYSTEM_PROMPT}]

        if conversation_history:
            # Include last 4 conversational turns for coherence
            messages.extend(conversation_history[-4:])

        prompt_content = (
            f"RELEVANT RESEARCH CONTEXT:\n{context_str}\n\n"
            f"USER RESEARCH QUESTION:\n{query}\n\n"
            f"Please synthesize a rigorous, detailed response citing the relevant pages where applicable."
        )

        messages.append({"role": "user", "content": prompt_content})

        # 3. Call LLM
        response_text = await self.llm.generate_response(messages=messages, temperature=0.2)

        return {
            "answer": response_text,
            "citations": citations,
            "agent_used": "research",
        }

_research_agent: Optional[ResearchAgent] = None

def get_research_agent() -> ResearchAgent:
    global _research_agent
    if _research_agent is None:
        _research_agent = ResearchAgent()
    return _research_agent
