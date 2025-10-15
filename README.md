# Reviso Exam Generation & Evaluation System

Reviso is an automated backend system for generating comprehensive exam questions and evaluating student answers. It leverages advanced language models and vector search to create high-quality educational content. The system is designed for educators, supporting multiple subjects and customizable exam configurations.

## Features

- **Exam Generation:**
  - Automatically generates descriptive and analytical exam questions.
  - Supports configurable difficulty levels (hard and medium).
  - Ensures balanced question distribution and comprehensive coverage of the topic.
- **Document Retrieval:**
  - Uses Pinecone vector search to retrieve relevant documents for exam creation.
  - Filters documents based on the subject for more targeted results.
- **Answer Evaluation:**
  - Evaluates student answers with detailed feedback, scoring, and suggestions for improvement.
  - Considers content accuracy, completeness, clarity, and depth of understanding.
- **Async Evaluation:**
  - Supports asynchronous evaluation for scalability, enabling batch processing of answers.
- **Customizable Exam Configuration:**
  - Allows users to specify the number of hard and medium questions.
  - Configurable total marks distribution.
- **Error Handling:**
  - Handles scenarios like missing documents or invalid configurations gracefully.
- **Extensible Design:**
  - Modular components make it easy to integrate additional features or adapt to new use cases.

## Supported Subjects

- DataMining
- Network
- Distributed
- Energy

## Technologies Used

- Python 3.8+
- LangChain
- OpenAI GPT-4o
- Pinecone Vector Database
- dotenv
- asyncio
- FastAPI (for running the backend as a web service)

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone https://github.com/Adarsha-Shrestha/Reviso.git
   cd Reviso/backend
   ```

2. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `backend` directory with the following:
   ```
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   INDEX_NAME=your_pinecone_index_name
   ```

4. **Run the backend exam system:**
   ```
   uvicorn main:app --reload
   ```

   This will generate sample exam questions for the topic "Classification Algorithms" under the "DataMining" subject.

## Repository

Find the full source code and updates at:  
[https://github.com/Adarsha-Shrestha/Reviso](https://github.com/Adarsha-Shrestha/Reviso)

