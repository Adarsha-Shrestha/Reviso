from typing import List, TypedDict, Optional


class GraphState(TypedDict):
    """
    Represents the state of our graph.

    Attributes:
        question: question
        subject: subject filter for retrieval
        generation: LLM generation
        web_search: whether to add search
        documents: list of documents
        sources: source information from document metadata
        loop_count: counter to prevent infinite loops
        is_conversational: flag for simple conversational queries
    """

    question: str
    subject: Optional[str]  # Added subject field
    generation: str
    web_search: bool
    documents: List[str]
    sources: Optional[List[dict]] 
    loop_count: int  # Added loop counter
    is_conversational: bool  # Added conversational flag