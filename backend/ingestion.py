from dotenv import load_dotenv
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders import WebBaseLoader
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyPDFLoader

load_dotenv()

embedding=OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.environ["INDEX_NAME"])

splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(chunk_size=700, chunk_overlap=0)

data_docs = PyPDFLoader(r"C:\Users\admin\Downloads\7th sem\7. Data Mining\Data Mining short  book.pdf").load()
split_data_docs = splitter.split_documents(data_docs)

# Add metadata
for doc in split_data_docs:
    doc.metadata = doc.metadata or {}
    doc.metadata["subject"] = "DataMining"
    
network_docs = PyPDFLoader(r"C:\Users\admin\Downloads\7th sem\2. Computer Network and Security\Computer_Network_Dinesh_Ghemosu.pdf").load()
split_network_docs = splitter.split_documents(network_docs)

# Add metadata
for doc in split_network_docs:
    doc.metadata = doc.metadata or {}
    doc.metadata["subject"] = "Network"
    
all_docs = split_data_docs + split_network_docs

# def batch_upload(docs, batch_size=50):
#     for i in range(0, len(docs), batch_size):
#         batch = docs[i:i + batch_size]
#         try:
#             PineconeVectorStore.from_documents(
#                 documents=batch,
#                 embedding=embedding,
#                 index_name=os.environ["INDEX_NAME"]
#             )
#             print(f"✅ Uploaded batch {i//batch_size + 1}")
#         except Exception as e:
#             print(f"❌ Failed on batch {i//batch_size + 1}: {e}")

# batch_upload(all_docs, batch_size=50)

# Create retriever function that supports subject filtering
def get_retriever(subject=None):
    vectorstore = PineconeVectorStore(
        index=index,
        embedding=embedding,
    )
    
    if subject:
        # Create retriever with metadata filter
        retriever = vectorstore.as_retriever(
            search_kwargs={"filter": {"subject": subject}}
        )
    else:
        # Create retriever without filter
        retriever = vectorstore.as_retriever()
    
    return retriever

# Default retriever (for backward compatibility)
retriever = get_retriever()
