import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

import requests
import psycopg2
import unicodedata

from datetime import date, timedelta, datetime

from scrapers.TMDBFetcher import TMDBFetcher
from scrapers.SupabaseManager import DBManager # Supabase
from classes.Film import Film
from classes.Director import Director
from tools.tools import charge_directors_with_AC, compare_directors, charge_directors_with_TMDB, add_isMainTrailer_info
from config.languages import SUPPORTED_LANGUAGES

import time

TMDB_Fetcher = TMDBFetcher()
DB_Manager = DBManager()

# Requete de suppression intervale de date :
# DELETE FROM movies
# WHERE release_date BETWEEN '1987-01-01' AND '1996-12-31';
#
# 1910 - 1962 YES
# 1963 - 1972 YES
# 1973 - 1986 YES
# 1987 - 1996 YES
# 1997 - 2006 YES
# 2007 - 2010 YES
# 2011 - 2016 YES
# 2017 - 2021 YES
# 2022 - 2026 YES
popular_movies_id = TMDB_Fetcher.get_most_popular_movies_id(2022,2026,100)
total_movies = len(popular_movies_id)
j = 0

for popular_movie_id in popular_movies_id :

    # Print
    j+=1
    print(f"{j}/{total_movies}")

    if DB_Manager.movie_exists_tmdbid(popular_movie_id): #######
        continue
    time.sleep(0.1)
    tmdb_movie_info = TMDB_Fetcher.get_movie_details(popular_movie_id)

    # Charge le film
    movie_id = DB_Manager.insert_movie_TMDB(tmdb_movie_info,None)
    time.sleep(0.1)

    # Charge les genres
    for genre in tmdb_movie_info.get('genres', []):
        if not DB_Manager.genre_exists(genre['name']): #######
            time.sleep(0.1)
            DB_Manager.insert_genre(genre['name']) #######
            time.sleep(0.1)
        genre_id = DB_Manager.get_genre_id(genre['name']) #######
        time.sleep(0.1)
        DB_Manager.insert_movie_genre(movie_id,genre_id) #######
        time.sleep(0.1)

    # Charge les Keywords

    # Charge les production_company
    for production_companie in tmdb_movie_info.get('production_companies', []):
        if not DB_Manager.production_companie_exist(production_companie['id']): #######
            time.sleep(0.1)
            DB_Manager.insert_production_company(production_companie['id'],production_companie['logo_path'],production_companie['name']) #######
            time.sleep(0.1)
        DB_Manager.insert_movie_production_company(movie_id, production_companie['id']) #######
        time.sleep(0.1)

    # Charge les réalisateurs
    crew = tmdb_movie_info.get("credits", {}).get("crew", [])
    for member in crew:
        if member.get("job") == "Director":
            person_id_tmdb = member.get("id")
            person_id = DB_Manager.get_people_id(None, person_id_tmdb, None) #######
            time.sleep(0.1)

            if person_id is None :
                person_id = DB_Manager.insert_people(person_id_tmdb,None,member.get("name"),member.get("profile_path")) #######
                time.sleep(0.1)
            DB_Manager.insert_movie_people(movie_id,person_id,"director",None) #######
            time.sleep(0.1)

    # Charge les Acteurs

    # Charge les Trailer associé au film
    trailers = TMDB_Fetcher.extract_tmdb_trailer(popular_movie_id,tmdb_movie_info.get("original_language"))
    trailers = add_isMainTrailer_info(trailers)

    for trailer in trailers :
        DB_Manager.insert_trailer(trailer, movie_id) #######
        time.sleep(0.1)