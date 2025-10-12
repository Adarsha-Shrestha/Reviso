# api/ingestion.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import os
import tempfile
from pathlib import Path
import logging
from dotenv import load_dotenv

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
from langchain_community.document_loaders import TextLoader, PyPDFLoader

load_dotenv()

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Initialize embeddings and Pinecone
embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.environ["INDEX_NAME"])

# Initialize text splitter
splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=700, 
    chunk_overlap=0
)

def ingest_documents(documents, subject: str):
    """Helper function to ingest documents into Pinecone"""
    try:
        # Add metadata to documents
        for doc in documents:
            doc.metadata = doc.metadata or {}
            doc.metadata["subject"] = subject
        
        # Split documents
        split_documents = splitter.split_documents(documents)
        
        # Upload to Pinecone
        PineconeVectorStore.from_documents(
            documents=split_documents,
            embedding=embedding,
            index_name=os.environ["INDEX_NAME"]
        )
        
        logger.info(f"✅ Successfully ingested {len(split_documents)} chunks with subject: {subject}")
        return {
            "status": "success",
            "chunks_ingested": len(split_documents),
            "subject": subject
        }
    except Exception as e:
        logger.error(f"❌ Error ingesting documents: {str(e)}")
        raise

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    subject: str = Form(...)
):
    """
    Upload a document (PDF or TXT) and ingest it into Pinecone
    
    Parameters:
    - file: The document file (PDF or TXT)
    - subject: The subject/category for the document (e.g., "DataMining", "Network")
    """
    
    # Validate file type
    allowed_extensions = {".pdf", ".txt"}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=file_ext,
        dir=tempfile.gettempdir()
    ) as tmp_file:
        try:
            # Write uploaded file to temporary location
            content = await file.read()
            tmp_file.write(content)
            tmp_file.flush()
            tmp_path = tmp_file.name
            
            # Load document based on file type
            if file_ext == ".pdf":
                loader = PyPDFLoader(tmp_path)
            else:  # .txt
                loader = TextLoader(tmp_path)
            
            documents = loader.load()
            
            if not documents:
                raise HTTPException(
                    status_code=400,
                    detail="No content found in the uploaded file"
                )
            
            # Ingest documents
            result = ingest_documents(documents, subject)
            
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Document uploaded and ingested successfully",
                    **result
                }
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error processing upload: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing document: {str(e)}"
            )
        finally:
            # Clean up temporary file
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {tmp_path}: {e}")

@router.post("/upload-multiple")
async def upload_multiple(
    files: list[UploadFile] = File(...),
    subject: str = Form(...)
):
    """
    Upload multiple documents at once
    
    Parameters:
    - files: List of document files (PDF or TXT)
    - subject: The subject/category for all documents
    """
    
    results = []
    errors = []
    all_documents = []
    
    allowed_extensions = {".pdf", ".txt"}
    
    for file in files:
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            errors.append(f"{file.filename}: Unsupported file type")
            continue
        
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=file_ext,
            dir=tempfile.gettempdir()
        ) as tmp_file:
            try:
                content = await file.read()
                tmp_file.write(content)
                tmp_file.flush()
                tmp_path = tmp_file.name
                
                if file_ext == ".pdf":
                    loader = PyPDFLoader(tmp_path)
                else:
                    loader = TextLoader(tmp_path)
                
                documents = loader.load()
                all_documents.extend(documents)
                results.append(f"{file.filename}: ✅ Loaded {len(documents)} pages/chunks")
                
            except Exception as e:
                errors.append(f"{file.filename}: {str(e)}")
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
    
    if not all_documents:
        raise HTTPException(
            status_code=400,
            detail="No valid documents to process"
        )
    
    try:
        result = ingest_documents(all_documents, subject)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Multiple documents uploaded and ingested successfully",
                "files_processed": results,
                "errors": errors if errors else None,
                **result
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))