from dotenv import load_dotenv
from langgraph.graph import END, StateGraph
from typing import Any, Dict, List, TypedDict, Optional
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Langchain imports
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from pydantic import BaseModel, Field
from pinecone import Pinecone

load_dotenv()

# Constants
AVAILABLE_SUBJECTS = ["DataMining", "Network", "Distributed", "Energy"]
RETRIEVE = "retrieve"
GENERATE_EXAM = "generate_exam"

# State Definition
class ExamState(TypedDict):
    question: str  # This will be the topic/subject for exam generation
    subject: Optional[str]
    documents: List[str]
    exam_data: Optional[List[dict]]
    exam_config: Optional[dict]
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
            search_kwargs={
                "filter": {"subject": subject},
                "k": 20  # Get more documents for exam generation
            }
        )
    else:
        retriever = vectorstore.as_retriever(search_kwargs={"k": 20})
    
    return retriever

# Exam models
class ExamQuestion(BaseModel):
    question: str = Field(description="The exam question (open-ended or descriptive)")
    question_type: str = Field(description="Type: descriptive, analytical, or conceptual")
    difficulty: str = Field(description="Difficulty level: medium or hard")
    marks: int = Field(description="Marks for this question: 5 or 10")
    key_points: List[str] = Field(description="Key points expected in the answer")
    sample_answer: str = Field(description="A comprehensive sample answer")

class ExamData(BaseModel):
    questions: List[ExamQuestion] = Field(description="List of exam questions")
    topic: str = Field(description="Topic or subject of the exam")
    total_questions: int = Field(description="Total number of questions generated")
    total_marks: int = Field(description="Total marks for the exam")

# LLMs and chains
llm = ChatOpenAI(temperature=0.3, model="gpt-4o-mini")
structured_llm_exam = llm.with_structured_output(ExamData)

exam_system_prompt = """You are an expert educational content creator specializing in generating comprehensive exam questions.

Your task is to create {num_hard} HARD questions (10 marks each) and {num_medium} MEDIUM questions (5 marks each) based on the provided documents.

**HARD Questions (10 marks each):**
- Should test deep understanding and analytical skills
- Require detailed, multi-faceted answers
- Test ability to apply concepts, analyze scenarios, or synthesize information
- Should take significant time and thought to answer properly
- Include complex scenarios or case studies

**MEDIUM Questions (5 marks each):**
- Should test core understanding and application
- Require moderate explanation with examples
- Test ability to explain concepts and their applications
- Should be answerable in a few paragraphs

**General Guidelines:**
1. Questions should be open-ended (descriptive, not multiple choice)
2. Cover different aspects of the topic comprehensively
3. Questions should build on each other in complexity
4. Provide key points that should be included in answers
5. Include a sample comprehensive answer for each question
6. Ensure questions test different cognitive levels (understand, apply, analyze, evaluate)

**Question Distribution:**
- First {num_hard} questions: HARD (10 marks each)
- Next {num_medium} questions: MEDIUM (5 marks each)

Generate questions that thoroughly assess knowledge of the topic."""

exam_prompt = ChatPromptTemplate.from_messages([
    ("system", exam_system_prompt),
    ("human", """Topic: {topic}
    
Documents:
{documents}

Number of HARD questions (10 marks): {num_hard}
Number of MEDIUM questions (5 marks): {num_medium}

Please generate exam questions based on this content.""")
])

exam_generator_chain: RunnableSequence = exam_prompt | structured_llm_exam

# Evaluation model and chain
class AnswerEvaluation(BaseModel):
    score: float = Field(description="Score awarded (out of maximum marks)")
    feedback: str = Field(description="Detailed feedback on the answer")
    strengths: List[str] = Field(description="Strong points in the answer")
    improvements: List[str] = Field(description="Areas for improvement")
    key_points_covered: List[str] = Field(description="Key points that were covered")
    key_points_missed: List[str] = Field(description="Key points that were missed")

evaluation_llm = ChatOpenAI(temperature=0.2, model="gpt-4o-mini")
structured_llm_evaluator = evaluation_llm.with_structured_output(AnswerEvaluation)

evaluation_system_prompt = """You are an expert educational evaluator assessing student exam answers.

Your task is to evaluate the student's answer against the expected answer and key points.

**Evaluation Criteria:**
1. **Content Accuracy** (40%): Is the information correct and accurate?
2. **Completeness** (30%): Are all key points covered?
3. **Clarity & Structure** (15%): Is the answer well-organized and clear?
4. **Depth of Understanding** (15%): Does it show deep understanding or just surface knowledge?

**Scoring Guidelines:**
- Award partial marks for partially correct or incomplete answers
- Be fair but rigorous in evaluation
- Consider the difficulty level and marks allocated
- Provide constructive feedback

**Output Requirements:**
- Score: Precise score out of the maximum marks (can be decimal, e.g., 7.5/10)
- Feedback: Detailed explanation of the scoring
- Strengths: What the student did well
- Improvements: What could be better
- Key points covered/missed: Track which expected points were addressed"""

evaluation_prompt = ChatPromptTemplate.from_messages([
    ("system", evaluation_system_prompt),
    ("human", """Question: {question}

Maximum Marks: {max_marks}
Difficulty: {difficulty}

Key Points Expected:
{key_points}

Sample Answer:
{sample_answer}

Student's Answer:
{student_answer}

Please evaluate this answer and provide a score out of {max_marks} marks.""")
])

evaluation_chain: RunnableSequence = evaluation_prompt | structured_llm_evaluator

# Node functions
def retrieve(state: ExamState) -> Dict[str, Any]:
    print("---RETRIEVE FOR EXAM---")
    topic = state["question"]
    subject = state.get("subject")
    
    # Create a comprehensive search query
    search_query = f"{topic} concepts theory applications examples problems"
    if subject:
        search_query = f"{subject} {search_query}"
        print(f"---FILTERING BY SUBJECT: {subject}---")
        retriever = get_retriever(subject=subject)
    else:
        print("---NO SUBJECT FILTER---")
        retriever = get_retriever()
    
    documents = retriever.invoke(search_query)
    print(f"---RETRIEVED {len(documents)} DOCUMENTS FOR EXAM GENERATION---")
    
    return {
        "documents": documents, 
        "question": topic,
        "subject": subject
    }

def generate_exam(state: ExamState) -> Dict[str, Any]:
    print("---GENERATE EXAM---")
    
    documents = state["documents"]
    topic = state["question"]
    subject = state.get("subject", "General")
    exam_config = state.get("exam_config", {})
    
    # Default exam configuration: 3 hard + 9 medium = 12 questions
    num_hard = exam_config.get("num_hard", 3)
    num_medium = exam_config.get("num_medium", 9)
    
    if not documents:
        print("---NO DOCUMENTS AVAILABLE FOR EXAM GENERATION---")
        return {
            "exam_data": [],
            "generation": "No documents available to generate exam questions.",
            "question": topic,
            "subject": subject
        }
    
    try:
        # Combine document content (take more content for comprehensive exam)
        doc_content = "\n\n".join([doc.page_content for doc in documents[:15]])
        
        # Generate exam questions
        exam_result = exam_generator_chain.invoke({
            "documents": doc_content,
            "topic": topic,
            "num_hard": num_hard,
            "num_medium": num_medium
        })
        
        print(f"---GENERATED {len(exam_result.questions)} EXAM QUESTIONS---")
        
        # Convert to serializable format and ensure correct marks distribution
        exam_data = []
        total_marks = 0
        
        for i, q in enumerate(exam_result.questions):
            # First num_hard questions should be 10 marks (hard)
            # Next num_medium questions should be 5 marks (medium)
            if i < num_hard:
                marks = 10
                difficulty = "hard"
            else:
                marks = 5
                difficulty = "medium"
            
            total_marks += marks
            
            exam_data.append({
                "question_number": i + 1,
                "question": q.question,
                "question_type": q.question_type,
                "difficulty": difficulty,
                "marks": marks,
                "key_points": q.key_points,
                "sample_answer": q.sample_answer
            })
        
        # Generate summary message
        generation = f"Generated {len(exam_data)} exam questions on {topic}. Total marks: {total_marks}"
        
        return {
            "exam_data": exam_data,
            "generation": generation,
            "documents": documents,
            "question": topic,
            "subject": subject,
            "exam_config": {**exam_config, "total_marks": total_marks}
        }
        
    except Exception as e:
        print(f"---EXAM GENERATION ERROR: {e}---")
        return {
            "exam_data": [],
            "generation": f"Error generating exam: {str(e)}",
            "question": topic,
            "subject": subject
        }

# Build graph
workflow = StateGraph(ExamState)

# Add nodes
workflow.add_node(RETRIEVE, retrieve)
workflow.add_node(GENERATE_EXAM, generate_exam)

# Build flow: retrieve -> generate exam
workflow.set_entry_point(RETRIEVE)
workflow.add_edge(RETRIEVE, GENERATE_EXAM)
workflow.add_edge(GENERATE_EXAM, END)

# Compile the app
exam_app = workflow.compile()

# Exam System with Evaluation
class ExamSystem:
    def __init__(self):
        self.app = exam_app
        self.current_exam = None
        self.executor = ThreadPoolExecutor(max_workers=5)
    
    def generate_exam(self, topic: str, subject: str = None, num_hard: int = 3, num_medium: int = 9):
        """Generate an exam on a specific topic"""
        try:
            response = self.app.invoke({
                "question": topic,
                "subject": subject,
                "documents": [],
                "exam_data": [],
                "exam_config": {
                    "num_hard": num_hard,
                    "num_medium": num_medium
                },
                "generation": ""
            })
            
            exam_data = response.get("exam_data", [])
            exam_config = response.get("exam_config", {})
            
            if exam_data:
                self.current_exam = {
                    "exam_data": exam_data,
                    "topic": topic,
                    "subject": subject,
                    "total_marks": exam_config.get("total_marks", 0)
                }
                return {
                    "success": True,
                    "exam_data": exam_data,
                    "message": f"Generated {len(exam_data)} questions on {topic}",
                    "subject": subject,
                    "total_marks": exam_config.get("total_marks", 0)
                }
            else:
                return {
                    "success": False,
                    "message": response.get("generation", "Failed to generate exam")
                }
                
        except Exception as e:
            return {"success": False, "message": f"Error generating exam: {e}"}
    
    async def evaluate_answer_async(self, question_data: dict, student_answer: str) -> dict:
        """Asynchronously evaluate a single answer"""
        try:
            # Format key points as a numbered list
            key_points_text = "\n".join([f"{i+1}. {point}" for i, point in enumerate(question_data["key_points"])])
            
            # Run evaluation in executor to avoid blocking
            loop = asyncio.get_event_loop()
            evaluation = await loop.run_in_executor(
                self.executor,
                lambda: evaluation_chain.invoke({
                    "question": question_data["question"],
                    "max_marks": question_data["marks"],
                    "difficulty": question_data["difficulty"],
                    "key_points": key_points_text,
                    "sample_answer": question_data["sample_answer"],
                    "student_answer": student_answer
                })
            )
            
            return {
                "question_number": question_data["question_number"],
                "score": evaluation.score,
                "max_marks": question_data["marks"],
                "feedback": evaluation.feedback,
                "strengths": evaluation.strengths,
                "improvements": evaluation.improvements,
                "key_points_covered": evaluation.key_points_covered,
                "key_points_missed": evaluation.key_points_missed,
                "success": True
            }
            
        except Exception as e:
            return {
                "question_number": question_data["question_number"],
                "score": 0,
                "max_marks": question_data["marks"],
                "error": str(e),
                "success": False
            }
    
    async def evaluate_exam_async(self, exam_id: str, answers: List[Dict[str, str]]) -> dict:
        """
        Asynchronously evaluate all answers in an exam
        
        Args:
            exam_id: ID of the exam
            answers: List of dicts with question_number and answer
            
        Returns:
            Evaluation results with scores and feedback
        """
        if not self.current_exam:
            return {"success": False, "message": "No exam loaded"}
        
        exam_data = self.current_exam["exam_data"]
        
        # Create evaluation tasks for all answers
        tasks = []
        for answer_item in answers:
            question_num = answer_item["question_number"]
            student_answer = answer_item["answer"]
            
            # Find the corresponding question
            question_data = next((q for q in exam_data if q["question_number"] == question_num), None)
            
            if question_data:
                tasks.append(self.evaluate_answer_async(question_data, student_answer))
        
        # Execute all evaluations concurrently
        print(f"---EVALUATING {len(tasks)} ANSWERS ASYNCHRONOUSLY---")
        evaluations = await asyncio.gather(*tasks)
        
        # Calculate total score
        total_score = sum(e["score"] for e in evaluations if e["success"])
        total_max_marks = self.current_exam["total_marks"]
        percentage = (total_score / total_max_marks * 100) if total_max_marks > 0 else 0
        
        # Generate overall feedback
        if percentage >= 90:
            overall_feedback = "Outstanding! Excellent understanding of the subject."
        elif percentage >= 80:
            overall_feedback = "Excellent work! Strong grasp of the concepts."
        elif percentage >= 70:
            overall_feedback = "Good performance! Solid understanding with room for improvement."
        elif percentage >= 60:
            overall_feedback = "Satisfactory. Review the concepts and practice more."
        elif percentage >= 50:
            overall_feedback = "Pass. Significant improvement needed in understanding."
        else:
            overall_feedback = "Needs improvement. Please review the material thoroughly."
        
        return {
            "success": True,
            "exam_id": exam_id,
            "topic": self.current_exam["topic"],
            "subject": self.current_exam.get("subject"),
            "evaluations": evaluations,
            "total_score": round(total_score, 2),
            "total_max_marks": total_max_marks,
            "percentage": round(percentage, 2),
            "overall_feedback": overall_feedback,
            "questions_evaluated": len(evaluations),
            "successful_evaluations": sum(1 for e in evaluations if e["success"])
        }
    
    def evaluate_exam(self, exam_id: str, answers: List[Dict[str, str]]) -> dict:
        """
        Synchronous wrapper for evaluate_exam_async
        """
        return asyncio.run(self.evaluate_exam_async(exam_id, answers))


if __name__ == "__main__":
    # Example usage
    exam_system = ExamSystem()
    
    # Generate exam
    result = exam_system.generate_exam(
        topic="Classification Algorithms",
        subject="DataMining",
        num_hard=3,
        num_medium=9
    )
    
    print(result["message"])
    
    if result["success"]:
        print(f"\nTotal Marks: {result['total_marks']}")
        print("\nQuestions Generated:")
        for q in result["exam_data"]:
            print(f"\nQ{q['question_number']}. [{q['marks']} marks] {q['question']}")