from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship

from .database import Base

class Discipline(Base):
    __tablename__ = "disciplines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    categories = relationship("Category", back_populates="discipline")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    discipline_id = Column(Integer, ForeignKey("disciplines.id"))
    discipline = relationship("Discipline", back_populates="categories")
    calendars = relationship("Calendar", back_populates="category")

class Calendar(Base):
    __tablename__ = "calendars"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="calendars")
    matches = relationship("Match", back_populates="calendar")
    rankings = relationship("Ranking", back_populates="calendar")

class Match(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True, index=True)  # Using cng (code) as id
    calendar_id = Column(Integer, ForeignKey("calendars.id"))
    giornata_id = Column(Integer)
    giornata_name = Column(String)

    date_timestamp = Column(Integer)
    location_name = Column(String)

    team1_name = Column(String)
    team1_logo = Column(String)
    team2_name = Column(String)
    team2_logo = Column(String)

    status = Column(String) # COMPLETED, SCHEDULED, etc.
    status_name = Column(String)
    score = Column(String) # "2-5"

    calendar = relationship("Calendar", back_populates="matches")

class Ranking(Base):
    __tablename__ = "rankings"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    calendar_id = Column(Integer, ForeignKey("calendars.id"))

    team_name = Column(String)
    team_logo = Column(String)

    points = Column(Integer)
    played = Column(Integer)
    won = Column(Integer)
    drawn = Column(Integer)
    lost = Column(Integer)
    goals_for = Column(Integer)
    goals_against = Column(Integer)
    goal_difference = Column(Integer)

    calendar = relationship("Calendar", back_populates="rankings")
