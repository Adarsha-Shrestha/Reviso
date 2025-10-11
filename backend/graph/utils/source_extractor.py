from typing import List, Dict, Any
from langchain.schema import Document


def extract_sources_from_documents(documents: List[Document]) -> List[Dict[str, Any]]:
    """
    Extract source information from document metadata
    
    Args:
        documents: List of Document objects
        
    Returns:
        List of source dictionaries with relevant metadata
    """
    sources = []
    
    for i, doc in enumerate(documents):
        source_info = {
            "document_id": i + 1,
            "page_content_preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
        }
        
        # Extract metadata information
        if hasattr(doc, 'metadata') and doc.metadata:
            metadata = doc.metadata
            
            # Add subject if available
            if "subject" in metadata:
                source_info["subject"] = metadata["subject"]
            
            # Add page number if available
            if "page" in metadata:
                source_info["page"] = metadata["page"]
            
            # Add source file if available
            if "source" in metadata:
                source_info["source_file"] = metadata["source"]
            
            # Add any other relevant metadata
            for key, value in metadata.items():
                if key not in ["subject", "page", "source"]:
                    source_info[key] = value
        
        sources.append(source_info)
    
    return sources


def format_sources_for_display(sources: List[Dict[str, Any]]) -> str:
    """
    Format sources for display to user
    
    Args:
        sources: List of source dictionaries
        
    Returns:
        Formatted string with source information
    """
    if not sources:
        return "No sources available."
    
    formatted_sources = []
    
    for source in sources:
        source_text = f"📄 **Source {source['document_id']}**"
        
        if "subject" in source:
            source_text += f"\n   📚 Subject: {source['subject']}"
        
        if "source_file" in source:
            import os
            filename = os.path.basename(source["source_file"])
            source_text += f"\n   📁 File: {filename}"
        
        if "page" in source:
            source_text += f"\n   📖 Page: {source['page']}"
        
        if "page_content_preview" in source:
            source_text += f"\n   📝 Preview: {source['page_content_preview']}"
        
        formatted_sources.append(source_text)
    
    return "\n\n".join(formatted_sources)