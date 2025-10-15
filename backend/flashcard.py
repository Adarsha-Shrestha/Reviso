from dotenv import load_dotenv
from langgraph.graph import END, StateGraph
from typing import Any, Dict, List, TypedDict, Optional
import os
import random

# Langchain imports
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from pydantic import BaseModel, Field
from pinecone import Pinecone

load_dotenv()

# Constants
AVAILABLE_SUBJECTS = ["DataMining", "Network", "Distributed"]
RETRIEVE = "retrieve"
GENERATE_FLASHCARDS = "generate_flashcards"

# State Definition
class FlashcardState(TypedDict):
    question: str  # This will be the topic/subject for flashcard generation
    subject: Optional[str]
    documents: List[str]
    flashcard_data: Optional[List[dict]]
    flashcard_config: Optional[dict]
    generation: str

# Initialize components
embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.environ["INDEX_NAME"])

# Retriever function
def get_retriever(subject=None):
    vectorstore = PineconeVectorStore(index=index, embedding=embedding)
    
    if subject:
        retriever = vectorstore.as_retriever(
            search_kwargs={"filter": {"subject": subject}}
        )
    else:
        retriever = vectorstore.as_retriever()
    
    return retriever

# Flashcard models
class Flashcard(BaseModel):
    front: str = Field(description="Question or prompt on the front of the card")
    back: str = Field(description="Answer or explanation on the back of the card")
    category: str = Field(description="Category or subtopic of this flashcard")
    difficulty: str = Field(description="Difficulty level: easy, medium, or hard")
    tags: List[str] = Field(description="List of relevant tags for this flashcard")

class FlashcardSet(BaseModel):
    flashcards: List[Flashcard] = Field(description="List of flashcards")
    topic: str = Field(description="Main topic of the flashcard set")
    total_cards: int = Field(description="Total number of flashcards generated")
    subject: str = Field(description="Academic subject area")

# LLMs and chains
llm = ChatOpenAI(temperature=0.3, model="gpt-4o-mini")
structured_llm_flashcard = llm.with_structured_output(FlashcardSet)

flashcard_system_prompt = """You are an expert educational content creator specializing in generating effective flashcards for active recall and spaced repetition learning.

Your task is to create flashcards based on the provided academic documents. Follow these guidelines:

1. **Front of Card (Question/Prompt):**
   - Create clear, specific questions or prompts
   - Use different question types: definitions, explanations, examples, comparisons
   - Make questions concise but complete
   - Include key terms and concepts

2. **Back of Card (Answer):**
   - Provide comprehensive but concise answers
   - Include key details and context
   - Use clear, student-friendly language
   - Add examples or mnemonics when helpful

3. **Content Strategy:**
   - Cover the most important concepts from the material
   - Create cards for definitions, processes, relationships, and applications
   - Include both foundational and advanced concepts
   - Ensure cards test understanding, not just memorization

4. **Organization:**
   - Assign appropriate categories/subtopics
   - Add relevant tags for easy searching
   - Set appropriate difficulty levels
   - Ensure cards are atomic (one concept per card)

Generate {num_cards} flashcards that will help students master the provided content."""

flashcard_prompt = ChatPromptTemplate.from_messages([
    ("system", flashcard_system_prompt),
    ("human", """Topic: {topic}
Subject: {subject}

Documents:
{documents}

Number of flashcards to generate: {num_cards}

Please generate flashcards based on this content.""")
])

flashcard_generator_chain: RunnableSequence = flashcard_prompt | structured_llm_flashcard

# Node functions
def retrieve(state: FlashcardState) -> Dict[str, Any]:
    print("---RETRIEVE FOR FLASHCARDS---")
    topic = state["question"]  # Using question as topic
    subject = state.get("subject")
    
    # Create a search query from the topic
    search_query = f"{topic} concepts definitions examples key terms"
    if subject:
        search_query = f"{subject} {search_query}"
        print(f"---FILTERING BY SUBJECT: {subject}---")
        retriever = get_retriever(subject=subject)
    else:
        print("---NO SUBJECT FILTER---")
        retriever = get_retriever()
    
    documents = retriever.invoke(search_query)
    print(f"---RETRIEVED {len(documents)} DOCUMENTS FOR FLASHCARD GENERATION---")
    
    return {
        "documents": documents, 
        "question": topic,
        "subject": subject
    }

def generate_flashcards(state: FlashcardState) -> Dict[str, Any]:
    print("---GENERATE FLASHCARDS---")
    
    documents = state["documents"]
    topic = state["question"]
    subject = state.get("subject", "General")
    flashcard_config = state.get("flashcard_config", {})
    
    # Default flashcard configuration
    num_cards = flashcard_config.get("num_cards", 10)
    
    if not documents:
        print("---NO DOCUMENTS AVAILABLE FOR FLASHCARD GENERATION---")
        return {
            "flashcard_data": [],
            "generation": "No documents available to generate flashcards.",
            "question": topic,
            "subject": subject
        }
    
    try:
        # Combine document content
        doc_content = "\n\n".join([doc.page_content for doc in documents])
        
        # Generate flashcards
        flashcard_result = flashcard_generator_chain.invoke({
            "documents": doc_content,
            "topic": topic,
            "subject": subject,
            "num_cards": num_cards
        })
        
        print(f"---GENERATED {len(flashcard_result.flashcards)} FLASHCARDS---")
        
        # Convert to serializable format
        flashcard_data = []
        for card in flashcard_result.flashcards:
            flashcard_data.append({
                "front": card.front,
                "back": card.back,
                "category": card.category,
                "difficulty": card.difficulty,
                "tags": card.tags
            })
        
        # Generate summary message
        generation = f"Generated {len(flashcard_data)} flashcards on {topic}. Cards cover various difficulty levels and subtopics. Ready for study session!"
        
        return {
            "flashcard_data": flashcard_data,
            "generation": generation,
            "documents": documents,
            "question": topic,
            "subject": subject,
            "flashcard_config": flashcard_config
        }
        
    except Exception as e:
        print(f"---FLASHCARD GENERATION ERROR: {e}---")
        return {
            "flashcard_data": [],
            "generation": f"Error generating flashcards: {str(e)}",
            "question": topic,
            "subject": subject
        }

# Build graph
workflow = StateGraph(FlashcardState)

# Add nodes
workflow.add_node(RETRIEVE, retrieve)
workflow.add_node(GENERATE_FLASHCARDS, generate_flashcards)

# Build simple flow: retrieve -> generate flashcards
workflow.set_entry_point(RETRIEVE)
workflow.add_edge(RETRIEVE, GENERATE_FLASHCARDS)
workflow.add_edge(GENERATE_FLASHCARDS, END)

# Compile the app
app3 = workflow.compile()

# Flashcard interaction system
class FlashcardSystem:
    def __init__(self):
        self.app = app3
        self.current_flashcards = None
    
    def generate_flashcards(self, topic: str, subject: str = None, num_cards: int = 10):
        """Generate flashcards on a specific topic"""
        try:
            response = self.app.invoke({
                "question": topic,  # Using question field as topic
                "subject": subject,
                "documents": [],
                "flashcard_data": [],
                "flashcard_config": {"num_cards": num_cards},
                "generation": ""
            })
            
            flashcard_data = response.get("flashcard_data", [])
            if flashcard_data:
                self.current_flashcards = flashcard_data
                return {
                    "success": True,
                    "flashcard_data": flashcard_data,
                    "message": f"Generated {len(flashcard_data)} flashcards on {topic}",
                    "subject": response.get("subject")
                }
            else:
                return {
                    "success": False,
                    "message": response.get("generation", "Failed to generate flashcards")
                }
                
        except Exception as e:
            return {"success": False, "message": f"Error generating flashcards: {e}"}
    
    def study_flashcards(self):
        """Study flashcards interactively"""
        if not self.current_flashcards:
            print("No flashcards available. Generate some first.")
            return
        
        print(f"\nStarting Flashcard Study Session")
        print(f"{len(self.current_flashcards)} cards to study")
        print("Commands: 'show' (reveal answer), 'next' (next card), 'quit' (end session)")
        print("=" * 60)
        
        # Shuffle flashcards for better learning
        study_cards = self.current_flashcards.copy()
        random.shuffle(study_cards)
        
        for i, card in enumerate(study_cards, 1):
            print(f"\nCard {i}/{len(study_cards)}")
            print(f"Category: {card.get('category', 'General')}")
            print(f"Difficulty: {card.get('difficulty', 'Unknown')}")
            print(f"Tags: {', '.join(card.get('tags', []))}")
            print("-" * 50)
            print(f"Question: {card['front']}")
            
            answered = False
            while not answered:
                command = input("\n> ").strip().lower()
                
                if command in ['show', 's']:
                    print(f"\nAnswer: {card['back']}")
                    answered = True
                elif command in ['next', 'n', '']:
                    answered = True
                elif command in ['quit', 'q']:
                    print("Study session ended!")
                    return
                else:
                    print("Commands: 'show', 'next', 'quit'")
        
        print("\nStudy session completed! Great job studying!")
    
    def display_flashcard_summary(self):
        """Display summary of current flashcards"""
        if not self.current_flashcards:
            print("No flashcards available.")
            return
        
        print(f"\nFlashcard Set Summary:")
        print(f"Total cards: {len(self.current_flashcards)}")
        
        # Count by difficulty
        difficulty_counts = {}
        category_counts = {}
        
        for card in self.current_flashcards:
            diff = card.get('difficulty', 'unknown')
            cat = card.get('category', 'General')
            
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        print("Difficulty distribution:")
        for diff, count in difficulty_counts.items():
            print(f"  {diff}: {count} cards")
        
        print("Category distribution:")
        for cat, count in category_counts.items():
            print(f"  {cat}: {count} cards")
    
    def interactive_mode(self):
        """Interactive flashcard session"""
        print("Flashcard Generation System")
        print("Available subjects:", ", ".join(AVAILABLE_SUBJECTS))
        print("Commands: 'generate', 'study', 'summary', 'quit'")
        
        while True:
            command = input("\nFlashcard command: ").strip().lower()
            
            if command == 'quit':
                print("Goodbye!")
                break
                
            elif command == 'generate':
                # Get topic
                topic = input("Enter topic/keywords: ").strip()
                if not topic:
                    print("Please enter a topic.")
                    continue
                
                # Get subject
                print("Select subject (or press Enter for auto-detect):")
                for i, subj in enumerate(AVAILABLE_SUBJECTS, 1):
                    print(f"{i}. {subj}")
                
                choice = input("Choice: ").strip()
                subject = None
                if choice.isdigit() and 1 <= int(choice) <= len(AVAILABLE_SUBJECTS):
                    subject = AVAILABLE_SUBJECTS[int(choice) - 1]
                
                # Get number of cards
                try:
                    num_cards = int(input("Number of flashcards (default 10): ") or "10")
                except ValueError:
                    num_cards = 10
                
                result = self.generate_flashcards(topic, subject, num_cards)
                print(result["message"])
                
                if result["success"]:
                    study_now = input("Start study session now? (y/n): ").strip().lower()
                    if study_now in ['y', 'yes']:
                        self.study_flashcards()
            
            elif command == 'study':
                if self.current_flashcards:
                    self.study_flashcards()
                else:
                    print("No flashcards available. Generate some first.")
            
            elif command == 'summary':
                self.display_flashcard_summary()
            
            else:
                print("Available commands: 'generate', 'study', 'summary', 'quit'")

if __name__ == "__main__":
    flashcard_system = FlashcardSystem()
    flashcard_system.interactive_mode()