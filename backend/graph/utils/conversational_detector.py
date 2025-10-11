from typing import Dict
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field


class QueryType(BaseModel):
    """Classify query type"""
    
    is_conversational: bool = Field(
        description="True if this is a simple greeting, casual conversation, or social interaction"
    )
    is_question: bool = Field(
        description="True if this requires factual information or knowledge"
    )


llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo")
structured_llm = llm.with_structured_output(QueryType)

system = """You are an expert at classifying user queries. Determine if a query is:

1. CONVERSATIONAL: 
   - Simple greetings (hello, hi, how are you), casual chat, social interactions, or pleasantries
   - Questions or topics that are *outside the given subject domain*
   - General small talk or unrelated inquiries (e.g., "what is the weather", "how old are you", "tell me a joke")

2. QUESTION: 
   - Requests for factual information, explanations, or knowledge *strictly within the given subject domain*.

Given subject: {subject}

Examples (assuming subject = "AI"):
- "hello" → conversational: true, question: false  
- "what is weather?" → conversational: true, question: false  
- "tell me about cats" → conversational: true, question: false  
- "what is classification in AI?" → conversational: false, question: true  
- "explain neural networks" → conversational: false, question: true  
- "thanks" → conversational: true, question: false  

Be strict: mark as question **only** if it is clearly a factual query about the given subject.
"""

query_classifier_prompt = ChatPromptTemplate.from_messages([
    ("system", system),
    ("human", "Query: {query}")
])

query_classifier = query_classifier_prompt | structured_llm


def detect_conversational_query(query: str, subject: str) -> Dict[str, bool]:
    """
    Detect if a query is conversational or informational
    
    Args:
        query: User input query
        
    Returns:
        Dict with is_conversational and is_question flags
    """
    result = query_classifier.invoke({"query": query, "subject": subject})
    return {
        "is_conversational": result.is_conversational,
        "is_question": result.is_question
    }