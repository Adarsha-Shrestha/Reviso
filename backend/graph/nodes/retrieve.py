from typing import Any, Dict

from graph.state import GraphState
from ingestion import get_retriever
from graph.utils.source_extractor import extract_sources_from_documents


def retrieve(state: GraphState) -> Dict[str, Any]:
    print("---RETRIEVE---")
    question = state["question"]
    subject = state.get("subject")
    loop_count = state.get("loop_count", 0)
    
    if subject:
        print(f"---FILTERING BY SUBJECT: {subject}---")
        retriever = get_retriever(subject=subject)
    else:
        print("---NO SUBJECT FILTER---")
        retriever = get_retriever()
    
    documents = retriever.invoke(question)
    print(f"---RETRIEVED {len(documents)} DOCUMENTS---")
    
    # Extract source information
    sources = extract_sources_from_documents(documents)
    
    return {
        "documents": documents, 
        "question": question, 
        "subject": subject,
        "sources": sources,
        "loop_count": loop_count,
        "is_conversational": False
    }