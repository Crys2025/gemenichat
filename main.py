import os

# 🔥 Ștergem proxy-urile înainte să importăm OpenAI
for key in ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
            "http_proxy", "https_proxy", "all_proxy"]:
    os.environ.pop(key, None)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from qdrant_client import QdrantClient

# Import OpenAI
from openai import OpenAI

OPENAI_MODEL = "gpt-4.1-mini"
EMBEDDING_MODEL = "text-embedding-3-small"
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "gemeni_site")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

app = FastAPI()

# Serving static files
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    query: str

@app.get("/")
def home():
    return {"status": "ok", "message": "GemeniBot backend online"}

@app.post("/ask")
def ask(question: Question):

    # Generate embeddings
    emb = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=question.query
    )
    vector = emb.data[0].embedding

    # Query Qdrant
    hits = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=5
    )

    # No context → direct OpenAI answer
    if not hits:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Ești GemeniBot"},
                {"role": "user", "content": f"Răspunde ca GemeniBot: {question.query}"}
            ]
        )
        return {"answer": resp.choices[0].message.content}

    # Build context
    context = ""
    for h in hits:
        p = h.payload or {}
        context += (
            f"Titlu: {p.get('title')}\n"
            f"URL: {p.get('url')}\n"
            f"Text: {p.get('text')}\n\n---\n\n"
        )

    system = (
    "Ești GemeniBot, un asistent care răspunde STRICT pe baza articolelor "
    "de pe site-ul pentrumamedegemeni.ro. "
    "Nu inventezi informații. Nu adaugi opinii personale. "
    "Nu generezi conținut nou decât dacă utilizatorul cere explicit un articol nou. "
    "Răspunzi foarte concis, 1-3 fraze maxim. "
    "DACĂ întrebarea nu are răspuns în context, spui exact: "
    "'Nu există informații despre asta pe site.' "
    "Nu folosești generalități, nu deviezi de la context."
)

    prompt = f"Context:\n{context}\nÎntrebare: {question.query}\nRăspuns:"

    # Final RAG completion
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
    )

    return {"answer": resp.choices[0].message.content}








