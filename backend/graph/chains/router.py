from typing import Literal

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field


class RouteQuery(BaseModel):
    """Route a user query to the most relevant datasource."""

    datasource: Literal["vectorstore", "websearch"] = Field(
        ...,
        description="Given a user question choose to route it to web search or a vectorstore.",
    )


llm = ChatOpenAI(temperature=0, model = "gpt-4o-mini")
structured_llm_router = llm.with_structured_output(RouteQuery)

system = """You are an expert at routing a user question to either a vectorstore or a web search.
The vectorstore contains documents related to:
- DataMining: Data mining concepts, algorithms, and techniques
- Network: Computer networks, protocols, and security concepts
- Distributed: Distributed systems, computing, and architectures
- Energy: Energy systems, renewable energy, and efficiency techniques

Routing instructions:
- If the question is specifically about these subjects and a subject filter is provided, use the vectorstore.
- If the question is general knowledge, unrelated to these subjects, or no subject filter is provided, use web search.
- Always consider the subject context when making routing decisions, and choose the source that is most likely to provide accurate and detailed information."""


route_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        ("human", "Question: {question}\nSubject: {subject}"),
    ]
)

question_router = route_prompt | structured_llm_router