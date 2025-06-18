import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Routers
from routes import auth, playlists
# from routes import transfer

app = FastAPI(
    title="Universal Music Playlist Converter API",
    description="The backend API for converting playlists between music streaming services.",
    version="2.0.0",
)

# Session Middleware (should be added before CORS)
app.add_middleware(
    SessionMiddleware, secret_key=os.environ.get("SESSION_SECRET_KEY", "your-super-secret-key")
)

# CORS Middleware
origins = [
    os.environ.get("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Status"])
async def health_check():
    """Health check endpoint to ensure the API is running."""
    return {"status": "ok", "timestamp": "..."}

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(playlists.router, prefix="/api/playlists", tags=["Playlists"])
# app.include_router(transfer.router, prefix="/api/transfer", tags=["Transfer"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 