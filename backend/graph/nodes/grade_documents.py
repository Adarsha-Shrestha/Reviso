from typing import Any, Dict

from graph.chains.retrieval_grader import retrieval_grader
from graph.state import GraphState
from graph.utils.source_extractor import extract_sources_from_documents


def grade_documents(state: GraphState) -> Dict[str, Any]:
    """
    Determines whether the retrieved documents are relevant to the question.
    If any document is not relevant, we will set a flag to run web search.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Filtered out irrelevant documents and updated web_search state
    """

    print("---CHECK DOCUMENT RELEVANCE TO QUESTION---")
    question = state["question"]
    documents = state["documents"]
    subject = state.get("subject")
    loop_count = state.get("loop_count", 0)

    filtered_docs = []
    web_search = False
    
    for d in documents:
        score = retrieval_grader.invoke(
            {"question": question, "document": d.page_content}
        )
        grade = score.binary_score
        if grade.lower() == "yes":
            print("---GRADE: DOCUMENT RELEVANT---")
            filtered_docs.append(d)
        else:
            print("---GRADE: DOCUMENT NOT RELEVANT---")
            web_search = True
            continue
    
    # Update sources to match filtered documents
    filtered_sources = extract_sources_from_documents(filtered_docs)
    
    return {
        "documents": filtered_docs, 
        "question": question, 
        "subject": subject,
        "web_search": web_search,
        "sources": filtered_sources,
        "loop_count": loop_count
    }
