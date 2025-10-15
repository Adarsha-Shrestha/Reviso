# Reviso: Exam Generation & Evaluation System

Reviso is a backend-driven platform for automated exam creation, proctoring, evaluation, and learning support. It uses language models and vector search to generate reliable academic content and assist both students and educators. The system supports custom configurations, analytics, and multi-subject integration.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)

   * [Functional](#functional-features)
   * [Non-Functional](#non-functional-features)
3. [Supported Subjects](#supported-subjects)
4. [Technology Stack](#technology-stack)
5. [Setup Instructions](#setup-instructions)

   * [Backend](#backend-setup)
   * [Frontend (Student)](#frontend-student-setup)
   * [Frontend (Admin)](#frontend-admin-setup)
6. [Repository](#repository)

---

## Overview

Reviso is designed for educators, institutions, and students to streamline the assessment lifecycle. It supports customizable exam formats, automated grading with detailed feedback, intelligent flashcards, quizzes, and advanced proctoring with cheating detection.

---

## Features

### Functional Features

**Interactive Chat**

* Conversational interface for accessing relevant preparation questions and explanations.

**Exam Generation**

* Creates descriptive and analytical questions.
* Supports configurable difficulty levels (e.g., hard, medium).
* Maintains topic coverage and balanced question distribution.

**Proctoring**

* Simulated exam hall environment with cheating detection.
* Records suspicious activity and stores evidence in `backend/cheating_recordings`.
* Detects behaviors such as eye movement, multiple persons, sound anomalies, and spoofing.

**Answer Evaluation**

* Automated assessment with scores, feedback, and suggestions for improvement.
* Evaluates accuracy, clarity, completeness, and depth.

**Configurable Exam Settings**

* Define the number of questions per difficulty level.
* Customize total marks distribution.

**Flashcard and Quiz Generation**

* Generates topic-based flashcards and quizzes.
* Allows customization by subject and number of items.

**Analytics**

* Student analytics for performance review.
* Admin analytics for institution-wide tracking.

### Non-Functional Features

**Asynchronous Evaluation**

* Supports scalable batch processing of assessments.

**Robust Error Handling**

* Gracefully handles invalid configurations and missing resources.

**Modular and Extensible Architecture**

* Components can be easily extended or integrated into other systems.

**Document Retrieval**

* Pinecone vector search used for sourcing relevant material.
* Filters based on subject requirements.

---

## Supported Subjects

* Data Mining
* Networking
* Distributed Systems
* Energy Systems

---

## Technology Stack

**Core**

* Python 3.8+
* FastAPI
* asyncio

**AI and Search**

* OpenAI GPT-4o
* LangChain
* Pinecone

**Utilities**

* dotenv

---

## Setup Instructions

### Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Adarsha-Shrestha/Reviso.git
   cd Reviso/backend
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the `backend` directory:

   ```bash
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   INDEX_NAME=your_pinecone_index_name
   ```

4. Add the proctoring model:

   * Place `best.pt` inside `backend/models`

5. Run the backend:

   ```bash
   uvicorn main:app --reload
   ```

---

### Frontend (Student) Setup

1. Navigate to the project:

   ```bash
   cd frontend/my-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

---

### Frontend (Admin) Setup

1. Navigate to the project:

   ```bash
   cd admin
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

---

## Repository

Full source code and updates are available at:
[https://github.com/Adarsha-Shrestha/Reviso](https://github.com/Adarsha-Shrestha/Reviso)
