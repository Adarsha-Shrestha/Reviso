import random
from typing import Dict, Any
from graph.state import GraphState


def generate_conversational_response(state: GraphState) -> Dict[str, Any]:
    """
    Generate simple responses for conversational queries
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with conversational response
    """
    question = state["question"].lower().strip()
    subject = state.get("subject", "your subject")
    
    # Define response patterns
    greeting_responses = [
        f"Hello! I'm here to help you with questions about {subject}. What would you like to know?",
        f"Hi there! I can help you understand topics related to {subject}. What's your question?",
        f"Hello! Ready to assist you with {subject}. What do you want to explore today?",
    ]
    
    how_are_you_responses = [
        f"I'm doing well, thank you! I'm ready to help with anything about {subject}.",
        f"I'm great! How can I assist you today with {subject} topics?",
        f"I'm doing fine, thanks for asking! What can I help you learn about in {subject}?",
    ]
    
    thanks_responses = [
        f"You're welcome! Feel free to ask more questions about {subject}.",
        f"Happy to help! Let me know if you’d like to learn more about {subject}.",
        f"Glad I could help! Ask me anything else about {subject} or related concepts.",
    ]
    
    general_responses = [
        f"I'm here to help! Please ask a specific question about {subject}.",
        f"Feel free to ask me anything about {subject}. I'm ready to explain!",
        f"I'm ready to assist you with {subject}. What would you like to know?",
    ]
    
    # Match patterns and generate responses
    if any(word in question for word in ["hello", "hi", "hey"]):
        response = random.choice(greeting_responses)
    elif any(phrase in question for phrase in ["how are you", "how do you do", "how's it going"]):
        response = random.choice(how_are_you_responses)
    elif any(word in question for word in ["thank", "thanks"]):
        response = random.choice(thanks_responses)
    else:
        response = random.choice(general_responses)
    
    return {
        "question": state["question"],
        "subject": state.get("subject"),
        "generation": response,
        "documents": [],
        "sources": [],
        "web_search": False,
        "loop_count": 0,
        "is_conversational": True
    }