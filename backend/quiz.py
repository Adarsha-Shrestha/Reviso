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
GENERATE_QUIZ = "generate_quiz"

# State Definition
class QuizState(TypedDict):
    question: str  # This will be the topic/subject for quiz generation
    subject: Optional[str]
    documents: List[str]
    quiz_data: Optional[List[dict]]
    quiz_config: Optional[dict]
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

# Quiz models
class QuizQuestion(BaseModel):
    question: str = Field(description="The quiz question")
    options: List[str] = Field(description="List of 4 multiple choice options")
    correct_answer: str = Field(description="The correct answer (A, B, C, or D)")
    explanation: str = Field(description="Explanation of why this is the correct answer")
    difficulty: str = Field(description="Difficulty level: easy, medium, or hard")

class QuizData(BaseModel):
    questions: List[QuizQuestion] = Field(description="List of quiz questions")
    topic: str = Field(description="Topic or subject of the quiz")
    total_questions: int = Field(description="Total number of questions generated")

# LLMs and chains
llm = ChatOpenAI(temperature=0.3, model="gpt-4o-mini")
structured_llm_quiz = llm.with_structured_output(QuizData)

quiz_system_prompt = """You are an expert educational content creator specializing in generating high-quality quiz questions from academic material.

Your task is to create multiple-choice quiz questions based on the provided documents. Follow these guidelines:

1. **Question Quality:**
   - Create clear, unambiguous questions
   - Ensure questions test understanding, not just memorization
   - Include a mix of difficulty levels (easy, medium, hard)
   - Cover different aspects of the topic

2. **Options:**
   - Provide exactly 4 options (A, B, C, D)
   - Make sure only one option is clearly correct
   - Create plausible distractors (incorrect options that seem reasonable)
   - Avoid options like "All of the above" or "None of the above"

3. **Content Coverage:**
   - Generate questions that cover the main concepts in the documents
   - Include both factual and conceptual questions
   - Test different cognitive levels (remember, understand, apply, analyze)

4. **Format:**
   - Label options as A, B, C, D
   - Provide clear explanations for correct answers
   - Assign appropriate difficulty levels

Generate {num_questions} questions based on the provided content."""

quiz_prompt = ChatPromptTemplate.from_messages([
    ("system", quiz_system_prompt),
    ("human", """Topic: {topic}
    
Documents:
{documents}

Number of questions to generate: {num_questions}

Please generate quiz questions based on this content.""")
])

quiz_generator_chain: RunnableSequence = quiz_prompt | structured_llm_quiz

# Node functions
def retrieve(state: QuizState) -> Dict[str, Any]:
    print("---RETRIEVE FOR QUIZ---")
    topic = state["question"]  # Using question as topic
    subject = state.get("subject")
    
    # Create a search query from the topic
    search_query = f"{topic} concepts definitions examples"
    if subject:
        search_query = f"{subject} {search_query}"
        print(f"---FILTERING BY SUBJECT: {subject}---")
        retriever = get_retriever(subject=subject)
    else:
        print("---NO SUBJECT FILTER---")
        retriever = get_retriever()
    
    documents = retriever.invoke(search_query)
    print(f"---RETRIEVED {len(documents)} DOCUMENTS FOR QUIZ GENERATION---")
    
    return {
        "documents": documents, 
        "question": topic,
        "subject": subject
    }

def generate_quiz(state: QuizState) -> Dict[str, Any]:
    print("---GENERATE QUIZ---")
    
    documents = state["documents"]
    topic = state["question"]
    subject = state.get("subject", "General")
    quiz_config = state.get("quiz_config", {})
    
    # Default quiz configuration
    num_questions = quiz_config.get("num_questions", 5)
    
    if not documents:
        print("---NO DOCUMENTS AVAILABLE FOR QUIZ GENERATION---")
        return {
            "quiz_data": [],
            "generation": "No documents available to generate quiz questions.",
            "question": topic,
            "subject": subject
        }
    
    try:
        # Combine document content
        doc_content = "\n\n".join([doc.page_content for doc in documents])
        
        # Generate quiz questions
        quiz_result = quiz_generator_chain.invoke({
            "documents": doc_content,
            "topic": topic,
            "num_questions": num_questions
        })
        
        print(f"---GENERATED {len(quiz_result.questions)} QUIZ QUESTIONS---")
        
        # Convert to serializable format
        quiz_data = []
        for q in quiz_result.questions:
            quiz_data.append({
                "question": q.question,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "difficulty": q.difficulty
            })
        
        # Generate summary message
        generation = f"Generated {len(quiz_data)} quiz questions on {topic}. Ready to start quiz!"
        
        return {
            "quiz_data": quiz_data,
            "generation": generation,
            "documents": documents,
            "question": topic,
            "subject": subject,
            "quiz_config": quiz_config
        }
        
    except Exception as e:
        print(f"---QUIZ GENERATION ERROR: {e}---")
        return {
            "quiz_data": [],
            "generation": f"Error generating quiz: {str(e)}",
            "question": topic,
            "subject": subject
        }

# Build graph
workflow = StateGraph(QuizState)

# Add nodes
workflow.add_node(RETRIEVE, retrieve)
workflow.add_node(GENERATE_QUIZ, generate_quiz)

# Build simple flow: retrieve -> generate quiz
workflow.set_entry_point(RETRIEVE)
workflow.add_edge(RETRIEVE, GENERATE_QUIZ)
workflow.add_edge(GENERATE_QUIZ, END)

# Compile the app
app2 = workflow.compile()

# Quiz interaction system
class QuizSystem:
    def __init__(self):
        self.app = app2
        self.current_quiz = None
        self.quiz_score = 0
        self.quiz_total = 0
    
    def generate_quiz(self, topic: str, subject: str = None, num_questions: int = 5):
        """Generate a quiz on a specific topic"""
        try:
            response = self.app.invoke({
                "question": topic,  # Using question field as topic
                "subject": subject,
                "documents": [],
                "quiz_data": [],
                "quiz_config": {"num_questions": num_questions},
                "generation": ""
            })
            
            quiz_data = response.get("quiz_data", [])
            if quiz_data:
                self.current_quiz = quiz_data
                return {
                    "success": True,
                    "quiz_data": quiz_data,
                    "message": f"Generated {len(quiz_data)} questions on {topic}",
                    "subject": response.get("subject")
                }
            else:
                return {
                    "success": False,
                    "message": response.get("generation", "Failed to generate quiz")
                }
                
        except Exception as e:
            return {"success": False, "message": f"Error generating quiz: {e}"}
    
    def take_quiz(self):
        """Take the current quiz interactively"""
        if not self.current_quiz:
            print("No quiz available. Generate one first.")
            return
        
        print(f"\nStarting Quiz - {len(self.current_quiz)} Questions")
        print("=" * 50)
        
        self.quiz_score = 0
        self.quiz_total = len(self.current_quiz)
        
        for i, question_data in enumerate(self.current_quiz, 1):
            print(f"\nQuestion {i}/{self.quiz_total}")
            print(f"Difficulty: {question_data.get('difficulty', 'Unknown')}")
            print("-" * 40)
            print(question_data['question'])
            print()
            
            # Display options
            for j, option in enumerate(question_data['options']):
                print(f"{chr(65+j)}. {option}")
            
            # Get user answer
            while True:
                answer = input("\nYour answer (A/B/C/D): ").strip().upper()
                if answer in ['A', 'B', 'C', 'D']:
                    break
                print("Please enter A, B, C, or D")
            
            # Check answer
            correct_answer = question_data['correct_answer'].upper()
            if answer == correct_answer:
                print("Correct!")
                self.quiz_score += 1
            else:
                print(f"Wrong! Correct answer: {correct_answer}")
            
            print(f"Explanation: {question_data.get('explanation', 'N/A')}")
            
            if i < self.quiz_total:
                input("\nPress Enter for next question...")
        
        # Show final results
        self.show_quiz_results()
    
    def show_quiz_results(self):
        """Display quiz results"""
        percentage = (self.quiz_score / self.quiz_total) * 100
        
        print("\n" + "=" * 50)
        print("QUIZ RESULTS")
        print("=" * 50)
        print(f"Score: {self.quiz_score}/{self.quiz_total}")
        print(f"Percentage: {percentage:.1f}%")
        
        if percentage >= 90:
            print("Excellent! Outstanding knowledge!")
        elif percentage >= 80:
            print("Great job! Very good understanding!")
        elif percentage >= 70:
            print("Good work! You're getting there!")
        elif percentage >= 60:
            print("Not bad, but more study needed!")
        else:
            print("Keep studying! You'll improve!")
        
        print("=" * 50)
    
    def interactive_mode(self):
        """Interactive quiz session"""
        print("Quiz Generation System")
        print("Available subjects:", ", ".join(AVAILABLE_SUBJECTS))
        print("Commands: 'generate', 'take', 'quit'")
        
        while True:
            command = input("\nQuiz command: ").strip().lower()
            
            if command == 'quit':
                print("Goodbye!")
                break
                
            elif command == 'generate':
                # Get subject
                print("Select subject (or press Enter for auto-detect):")
                for i, subj in enumerate(AVAILABLE_SUBJECTS, 1):
                    print(f"{i}. {subj}")
                
                choice = input("Choice: ").strip()
                subject = None
                if choice.isdigit() and 1 <= int(choice) <= len(AVAILABLE_SUBJECTS):
                    subject = AVAILABLE_SUBJECTS[int(choice) - 1]
                    
                # Get topic
                topic = input("Enter topic/keywords: ").strip()
                if not topic:
                    print("Please enter a topic.")
                    continue
                
                # Get number of questions
                try:
                    num_questions = int(input("Number of questions (default 5): ") or "5")
                except ValueError:
                    num_questions = 5
                
                result = self.generate_quiz(topic, subject, num_questions)
                print(result["message"])
                
                if result["success"]:
                    take_now = input("Take the quiz now? (y/n): ").strip().lower()
                    if take_now in ['y', 'yes']:
                        self.take_quiz()
            
            elif command == 'take':
                if self.current_quiz:
                    self.take_quiz()
                else:
                    print("No quiz available. Generate one first.")
            
            else:
                print("Available commands: 'generate', 'take', 'quit'")

if __name__ == "__main__":
    quiz_system = QuizSystem()
    quiz_system.interactive_mode()