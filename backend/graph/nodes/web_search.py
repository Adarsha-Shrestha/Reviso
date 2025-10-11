from typing import Any, Dict

from dotenv import load_dotenv
from langchain.schema import Document
from langchain_tavily import TavilySearch

from graph.state import GraphState
from graph.utils.source_extractor import extract_sources_from_documents

load_dotenv()
web_search_tool = TavilySearch(max_results=3)


def web_search(state: GraphState) -> Dict[str, Any]:
    print("---WEB SEARCH---")
    question = state["question"]
    subject = state.get("subject")
    documents = state.get("documents", [])
    sources = state.get("sources", [])
    loop_count = state.get("loop_count", 0)
    
    # Increment loop counter
    loop_count += 1
    print(f"---WEB SEARCH ATTEMPT {loop_count}---")
    
    # Enhance search query with subject context if available
    search_query = question
    if subject:
        search_query = f"{question} {subject}"
        print(f"---ENHANCED SEARCH QUERY: {search_query}---")
    
    tavily_results = web_search_tool.invoke({"query": search_query})["results"]
    
    # Create web search documents with proper metadata
    web_docs = []
    for i, result in enumerate(tavily_results):
        web_doc = Document(
            page_content=result["content"],
            metadata={
                "source": result.get("url", "Web Search"),
                "title": result.get("title", f"Web Result {i+1}"),
                "subject": "Web Search",
                "search_query": search_query,
                "search_attempt": loop_count
            }
        )
        web_docs.append(web_doc)
    
    # Combine with existing documents
    all_documents = documents + web_docs
    
    # Update sources to include web search results
    updated_sources = extract_sources_from_documents(all_documents)
    
    return {
        "documents": all_documents, 
        "question": question, 
        "subject": subject,
        "sources": updated_sources,
        "loop_count": loop_count,
        "is_conversational": False
    }