import requests
import sys
import os

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import Discipline, Category, Calendar, Match, Ranking

# Create tables
Base.metadata.create_all(bind=engine)

PUBLIC_KEY = "e07a5544ef2fbbdd96a29467cda80c8d:8a"
BASE_URL = "https://www.gestionecampionati.it/webapp/app"

def get_session():
    # First get index to obtain cookies
    session = requests.Session()
    session.get(f"{BASE_URL}/index.php?public_key={PUBLIC_KEY}")
    return session

def scrape_data():
    session = get_session()
    db = SessionLocal()

    print("Fetching disciplines...")
    # Get Disciplines
    response = session.post(f"{BASE_URL}/ajax.php?act=User&method=GetDiscipline", data={"public_key": PUBLIC_KEY})
    if response.status_code != 200:
        print("Failed to fetch disciplines")
        return

    data = response.json()
    if data.get("error_description"):
        print(f"Error: {data['error_description']}")
        return

    disciplines_data = data.get("data", {})

    for d_id, d_info in disciplines_data.items():
        db_discipline = db.query(Discipline).filter(Discipline.id == int(d_id)).first()
        if not db_discipline:
            db_discipline = Discipline(id=int(d_id), name=d_info["nd"])
            db.add(db_discipline)
        else:
            db_discipline.name = d_info["nd"]

        # Categories
        for c_id, c_info in d_info.get("cats", {}).items():
            db_category = db.query(Category).filter(Category.id == int(c_id)).first()
            if not db_category:
                db_category = Category(id=int(c_id), name=c_info["nc"], discipline_id=db_discipline.id)
                db.add(db_category)
            else:
                db_category.name = c_info["nc"]

            # Calendars
            for cal_id, cal_info in c_info.get("cals", {}).items():
                db_calendar = db.query(Calendar).filter(Calendar.id == int(cal_id)).first()
                if not db_calendar:
                    db_calendar = Calendar(id=int(cal_id), name=cal_info["n_cal"], category_id=db_category.id)
                    db.add(db_calendar)
                else:
                    db_calendar.name = cal_info["n_cal"]

                db.commit() # commit early to get ids

                print(f"Fetching calendar {cal_id} matches...")
                fetch_calendar_matches(session, db, int(cal_id))

                print(f"Fetching calendar {cal_id} ranks...")
                fetch_calendar_ranks(session, db, int(cal_id))

    db.close()
    print("Scraping completed!")

def fetch_calendar_matches(session, db, calendar_id):
    response = session.get(f"{BASE_URL}/ajax.php?act=User&method=GetCalendar&id_calendario={calendar_id}")
    if response.status_code != 200:
        return

    data = response.json()
    if data.get("error_description"):
        return

    giornate = data.get("data", [])
    if not giornate:
        return

    for giornata in giornate:
        g_id = giornata.get("id_gc")
        g_name = giornata.get("nmg")
        matches = giornata.get("m", [])

        for m in matches:
            cng = m.get("cng")
            db_match = db.query(Match).filter(Match.id == cng).first()

            score_arr = m.get("res", {}).get("std", [])
            score = score_arr[0] if score_arr else None

            if not db_match:
                db_match = Match(
                    id=cng,
                    calendar_id=calendar_id,
                    giornata_id=g_id,
                    giornata_name=g_name,
                    date_timestamp=m.get("ds"),
                    location_name=m.get("ni"),
                    team1_name=m.get("sq1"),
                    team1_logo=m.get("l1"),
                    team2_name=m.get("sq2"),
                    team2_logo=m.get("l2"),
                    status=m.get("ss"),
                    status_name=m.get("ssn"),
                    score=score
                )
                db.add(db_match)
            else:
                db_match.date_timestamp = m.get("ds")
                db_match.location_name = m.get("ni")
                db_match.status = m.get("ss")
                db_match.status_name = m.get("ssn")
                db_match.score = score

    db.commit()

def fetch_calendar_ranks(session, db, calendar_id):
    response = session.get(f"{BASE_URL}/ajax.php?act=User&method=GetRanks&id_calendario={calendar_id}")
    if response.status_code != 200:
        return

    data = response.json()
    if data.get("error_description"):
        return

    ranks_data = data.get("data", {})
    if not ranks_data or isinstance(ranks_data.get("gen"), list):
        # Sometimes 'gen' is an empty list instead of a dict when there are no ranks
        return

    gen_ranks = ranks_data.get("gen", {}).get("data", [])
    if not gen_ranks:
        return

    # Clear existing rankings for this calendar
    db.query(Ranking).filter(Ranking.calendar_id == calendar_id).delete()

    for rank in gen_ranks:
        db_rank = Ranking(
            calendar_id=calendar_id,
            team_name=rank.get("ns"),
            team_logo=rank.get("img_logo"),
            points=int(rank.get("Pt", 0)),
            played=int(rank.get("G", 0)),
            won=int(rank.get("V", 0)),
            drawn=int(rank.get("N", 0)),
            lost=int(rank.get("P", 0)),
            goals_for=int(rank.get("GF", 0)),
            goals_against=int(rank.get("GS", 0)),
            goal_difference=int(rank.get("DR", 0))
        )
        db.add(db_rank)

    db.commit()

if __name__ == "__main__":
    scrape_data()
