from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, database

import asyncio
from contextlib import asynccontextmanager

from .scraper import scrape_data

async def periodic_scraper():
    while True:
        try:
            print("Running periodic scrape...")
            # Run the scraper in a separate thread so it doesn't block the event loop
            await asyncio.to_thread(scrape_data)
            print("Scrape finished successfully. Waiting 1 hour...")
        except Exception as e:
            print(f"Error during scrape: {e}")
            print("Retrying in 5 minutes...")
            await asyncio.sleep(300)
            continue

        # Wait for 1 hour (3600 seconds)
        await asyncio.sleep(3600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup - start the periodic scraper
    task = asyncio.create_task(periodic_scraper())
    yield
    # Teardown - cancel the task on shutdown
    task.cancel()

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Football Manager API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/disciplines")
def get_disciplines(db: Session = Depends(get_db)):
    disciplines = db.query(models.Discipline).all()
    result = []
    for d in disciplines:
        categories = db.query(models.Category).filter(models.Category.discipline_id == d.id).all()
        cats_result = []
        for c in categories:
            calendars = db.query(models.Calendar).filter(models.Calendar.category_id == c.id).all()
            cats_result.append({
                "id": c.id,
                "name": c.name,
                "calendars": [{"id": cal.id, "name": cal.name} for cal in calendars]
            })
        result.append({
            "id": d.id,
            "name": d.name,
            "categories": cats_result
        })
    return result

@app.get("/calendars/{calendar_id}/matches")
def get_calendar_matches(calendar_id: int, db: Session = Depends(get_db)):
    matches = db.query(models.Match).filter(models.Match.calendar_id == calendar_id).order_by(models.Match.date_timestamp).all()
    # Group by giornata
    giornate = {}
    for match in matches:
        g_name = match.giornata_name
        if g_name not in giornate:
            giornate[g_name] = []
        giornate[g_name].append({
            "id": match.id,
            "date_timestamp": match.date_timestamp,
            "location_name": match.location_name,
            "team1_name": match.team1_name,
            "team1_logo": match.team1_logo,
            "team2_name": match.team2_name,
            "team2_logo": match.team2_logo,
            "status": match.status,
            "status_name": match.status_name,
            "score": match.score,
        })

    # Convert to list
    return [{"giornata_name": k, "matches": v} for k, v in giornate.items()]

@app.get("/calendars/{calendar_id}/rankings")
def get_calendar_rankings(calendar_id: int, db: Session = Depends(get_db)):
    rankings = db.query(models.Ranking).filter(models.Ranking.calendar_id == calendar_id).order_by(models.Ranking.points.desc(), models.Ranking.goal_difference.desc()).all()
    return rankings
