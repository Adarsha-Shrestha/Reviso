from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(temperature=0.3, model="gpt-4o-mini")

# Simplified conversational prompt
conversational_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an AI tutor helping students learn {subject}. Explain topics, use real-life analogies relatable to students when helpful. If a topic is broad, start from basics. Only answer from the provided context; if unavailable, say "I don't have information about that in my knowledge base." Never alter retrieved content. End with 2-3 conversational follow-up options based on what was just explained. These should be relevent questions and natural conversation starters that let the user explore related topics."""),
    ("human", """Context:
{context}

Question: {question}

Provide a clear explanation based on the context above.""")
])

generation_chain = conversational_prompt | llm | StrOutputParser()