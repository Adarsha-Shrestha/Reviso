from typing import Dict
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field


class QueryType(BaseModel):
    """Query classification"""
    
    is_conversational: bool = Field(
        description="True if greeting, thanks, or casual chat"
    )
    is_question: bool = Field(
        description="True if seeking factual information about the subject"
    )
    requires_context: bool = Field(
        description="True if references previous conversation"
    )


llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")
structured_llm = llm.with_structured_output(QueryType)

# Simplified system prompt
system = """Classify the user's query for a {subject} learning assistant:

**CONVERSATIONAL** (casual, not seeking information):
- Greetings: "hi", "hello"
- Thanks: "thanks", "thank you"
- Casual: "how are you"
- Off-topic questions

**QUESTION** (seeking information):
- Questions about {subject} topics
- Requests for explanations
- "What is...", "How does...", "Explain..."

**REQUIRES CONTEXT**:
- Follow-ups: "tell me more", "what about..."
- References: "you mentioned...", "in your last answer"

Be strict: Only mark as question if it's truly about {subject}."""

query_classifier_prompt = ChatPromptTemplate.from_messages([
    ("system", system),
    ("human", "Query: {query}")
])

query_classifier = query_classifier_prompt | structured_llm


def detect_conversational_query(query: str, subject: str = "general") -> Dict:
    """
    Detect query type with minimal overhead
    
    Args:
        query: User input
        subject: Subject context
        
    Returns:
        Dict with classification flags
    """
    result = query_classifier.invoke({
        "query": query,
        "subject": subject or "general topics"
    })
    
    return {
        "is_conversational": result.is_conversational,
        "is_question": result.is_question,
        "requires_context": result.requires_context
    }