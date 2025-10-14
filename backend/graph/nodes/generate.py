from typing import Any, Dict

from graph.chains.conversational_generation import generation_chain
from graph.state import GraphState


def generate(state: GraphState) -> Dict[str, Any]:
    """
    Enhanced generation node that produces conversational answers
    """
    print("---GENERATE (CONVERSATIONAL MODE)---")
    
    question = state["question"]
    documents = state["documents"]
    subject = state.get("subject", "this topic")
    sources = state.get("sources", [])
    loop_count = state.get("loop_count", 0)
    conversation_history = state.get("conversation_history", [])
    
    # Build context from documents
    context = "\n\n".join([doc.page_content if hasattr(doc, 'page_content') else str(doc) for doc in documents])
    
    # Generate conversational answer
    print(f"   Subject: {subject}")
    print(f"   Context length: {len(context)} chars")
    
    generation = generation_chain.invoke({
        "context": context,
        "question": question,
        "subject": subject
    })
    
    print(f"   Generated answer length: {len(generation)} chars")
    
    # Simple quality check
    answer_quality_score = "excellent" if len(generation) > 200 and len(documents) >= 2 else "good"
    
    return {
        "documents": documents,
        "question": question,
        "subject": subject,
        "generation": generation,
        "sources": sources,
        "loop_count": loop_count,
        "is_conversational": False,
        "answer_quality_score": answer_quality_score
    }