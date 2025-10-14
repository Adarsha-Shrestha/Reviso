from typing import List, TypedDict, Optional


class GraphState(TypedDict):
    """
    Enhanced state of the conversational RAG graph.

    Attributes:
        question: Current user question
        subject: Subject filter for retrieval (DataMining, Network, etc.)
        generation: LLM generated answer
        web_search: Whether to add web search
        documents: List of retrieved documents
        sources: Source information from document metadata
        loop_count: Counter to prevent infinite loops
        is_conversational: Flag for simple conversational queries (greetings, etc.)
        conversation_history: Previous Q&A pairs for context (optional)
        answer_quality_score: Internal quality assessment of the answer
    """

    question: str
    subject: Optional[str]
    generation: str
    web_search: bool
    documents: List[str]
    sources: Optional[List[dict]]
    loop_count: int
    is_conversational: bool
    conversation_history: Optional[List[dict]]
    answer_quality_score: Optional[str]  # "excellent", "good", "needs_improvement"