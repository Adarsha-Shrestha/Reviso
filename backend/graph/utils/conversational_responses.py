import random
from typing import Dict, Any
from graph.state import GraphState


def generate_conversational_response(state: GraphState) -> Dict[str, Any]:
    """
    Generate simple, warm responses for conversational queries
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with conversational response
    """
    question = state["question"].lower().strip()
    subject = state.get("subject", "your studies")
    
    # Natural, concise response patterns
    greeting_responses = [
        f"Hey! I'm here to help you understand {subject} better. What would you like to learn?",
        f"Hi there! Ready to explore {subject} concepts with you. What's your question?",
        f"Hello! Let's make {subject} easier to understand. What topic interests you?",
    ]
    
    how_are_you_responses = [
        f"I'm doing great! Ready to help you with {subject}. What would you like to know?",
        f"Doing well! What {subject} topic can I help clarify today?",
        f"I'm good! How's your learning going? Any {subject} questions?",
    ]
    
    thanks_responses = [
        f"You're welcome! Feel free to ask more about {subject} anytime.",
        f"Happy to help! Let me know if you need anything else about {subject}.",
        f"Glad I could help! Don't hesitate to ask more questions.",
    ]
    
    help_responses = [
        f"I can help you with {subject}! Try asking:\n• 'Explain [concept]'\n• 'What is [topic]?'\n• 'How does [X] work?'\n\nWhat would you like to know?",
        f"Sure! Ask me about any {subject} concept and I'll explain it step-by-step. What's your question?",
    ]
    
    confused_responses = [
        f"I'd love to help! What specific {subject} topic are you curious about?",
        f"Let me assist you! What aspect of {subject} would you like to explore?",
    ]
    
    # Pattern matching
    if any(word in question for word in ["hello", "hi", "hey", "good morning", "good afternoon"]):
        response = random.choice(greeting_responses)
        
    elif any(phrase in question for phrase in ["how are you", "how do you do", "how's it going", "what's up"]):
        response = random.choice(how_are_you_responses)
        
    elif any(word in question for word in ["thank", "thanks", "appreciate"]):
        response = random.choice(thanks_responses)
        
    elif any(phrase in question for phrase in ["can you help", "help me", "i need help"]):
        response = random.choice(help_responses)
        
    elif any(word in question for word in ["bye", "goodbye", "see you"]):
        response = f"Goodbye! Good luck with your {subject} studies. Come back anytime!"
        
    else:
        response = random.choice(confused_responses)
    
    return {
        "question": state["question"],
        "subject": state.get("subject"),
        "generation": response,
        "documents": [],
        "sources": [],
        "web_search": False,
        "loop_count": 0,
        "is_conversational": True,
        "answer_quality_score": "conversational"
    }