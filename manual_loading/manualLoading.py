import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

import requests
import json

from scrapers.TMDBFetcher import TMDBFetcher
from scrapers.DBManager import DBManager
from classes.Film import Film

TMDB_Fetcher = TMDBFetcher()
DB_Manager = DBManager()

# -------------------------------------------------------------------------------
id_db = "211"
id_tmdb = "1311031"
data = TMDB_Fetcher.get_movie_details(id_tmdb)

is_adult = data['adult']
original_language = data['original_language']
overview = data['overview']
popularity = data['popularity']
poster_path = data['poster_path']
revenue = data['revenue']
budget = data['budget']
vote_average = data['vote_average']
vote_count = data['vote_count']
languages = [lang.get("iso_639_1") for lang in data.get("spoken_languages", [])]

# Modif Film
DB_Manager.update_movie_TMDB(
    movie_id=id_db,
    tmdb_id=id_tmdb,
    is_adult=is_adult,
    original_language=original_language,
    overview=overview,
    popularity=popularity,
    poster_path=poster_path,
    revenue=revenue,
    budget=budget,
    vote_average=vote_average,
    vote_count=vote_count,
    spoken_languages=languages
)

# Personne
for crew in data['credits']['crew']:
    if crew['job'] == "Director" :
        if not DB_Manager.people_exists(crew['id']):
            DB_Manager.insert_people(crew['id'],crew['name'],crew['profile_path'])
        DB_Manager.insert_movie_people(id_db,crew['id'], "director")

for cast in data['credits']['cast'][:5]:
    if not DB_Manager.people_exists(cast['id']):
        DB_Manager.insert_people(cast['id'],cast['name'],cast['profile_path'])
    DB_Manager.insert_movie_people(id_db,cast['id'], "actor",cast['character'])

# Company de production
for production_companie in data['production_companies']:
    if not DB_Manager.production_companie_exist(production_companie['id']):
        DB_Manager.insert_production_company(production_companie['id'],production_companie['logo_path'],production_companie['name'])
    DB_Manager.insert_movie_production_company(id_db, production_companie['id'])

# Genres
for genre in data['genres']:
    if not DB_Manager.genre_exists(genre['name']):
        DB_Manager.insert_genre(genre['name'])
    genre_id = DB_Manager.get_genre_id(genre['name'])
    DB_Manager.insert_movie_genre(id_db,genre_id)