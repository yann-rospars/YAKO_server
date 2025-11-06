import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

import requests
import psycopg2
import unicodedata

from datetime import date, timedelta, datetime

from scrapers.TMDBFetcher import TMDBFetcher
from scrapers.DBManager import DBManager
from classes.Film import Film
from tools.tools import normalize_name

TMDB_Fetcher = TMDBFetcher()
DB_Manager = DBManager()

# -------------------------------------------------------------------------------
# Ajout des nouveaux films, des scneace du prochain moi dans la base de données
# -------------------------------------------------------------------------------
def paris_sessions():

    # Date d'aujourd'hui
    today = date.today()

    # Cinema 
    cine_nb = 0
    cinemas = DB_Manager.get_cinemas()
    for cinema in cinemas: # Pour chaque cinema

        cine_nb +=1
        if(cine_nb == 8): #TEST Cine X

            print(f"{cine_nb}. Cinéma : {cinema['name']} (Allociné ID : {cinema['idallocine']})")
            for i in range (30):   # Sur 30 jours

                day = today + timedelta(days=i)

                if(cinema["wherefind"] == "allocine"):
                    fecth_allocine_sessions(cinema["idallocine"], day, cinema["id"])
                break # TEST Jour 1


# -------------------------------------------------------------------------------
# Ajout des nouveaux films, des scneace d'un cinema pour 1 jours, dans la base de données
# -------------------------------------------------------------------------------
def fecth_allocine_sessions(CineID_AC, day, cineID):

    day_str = day.strftime('%Y-%m-%d')

    url = f"https://www.allocine.fr/_/showtimes/theater-{CineID_AC}/d-{day_str}/"
    headers = {
        "Referer": f"https://www.allocine.fr/seance/salle_gen_csalle={CineID_AC}.html",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0"
    }
    response = requests.get(url, headers=headers)
    data = response.json()

    if data.get("error") is False:

        # Extraire les films et leurs sceances
        for movie in data.get("results", []):
            movie_info = movie.get("movie", {})
            showtimes = movie.get("showtimes", {})

            # informations du film
            movie_ac = Film.from_allocine(movie_info)

            # Vérification de son existance dans notre BD
            if DB_Manager.movie_exists_allocineID(movie_ac.id):
                print(f"Le film {movie_ac.title} avec l'id_allocine {movie_ac.id} existe déjà dans la BD.")
                movie_id = DB_Manager.get_movie_id(allocine_id=movie_ac.id)
            else:
                print(f"Le film {movie_ac.title} avec l'id_allocine {movie_ac.id} n'existe pas dans la BD.")
                movie_id = add_movie_to_BD(movie_ac)

            # stockage des scéances
            for category in ["original", "dubbed", "local", "multiple"]:
                for session in showtimes.get(category, []):
                    add_sessions_to_bd(movie_id, cineID, session)

# -------------------------------------------------------------------------------
# ajout d'un film dans la BD depuis TMDB
# -------------------------------------------------------------------------------
def add_movie_to_BD(movie_ac):
    
    existe_tmdb = False # Mode de chargement du film
    potential_movies_tmdb = TMDB_Fetcher.get_potentials_movies_tmdb(movie_ac)
    movie_tmdb = None

    # --- selectionne le bon film
    for potenial_movie in potential_movies_tmdb:
        data = TMDB_Fetcher.get_movie_details(potenial_movie.id)

        # Ajout du runtime et du realisateur
        potenial_movie.runtime = data.get("runtime")
        crew = data.get("credits", {}).get("crew", [])
        for member in crew:
            if member.get("job") == "Director":
                potenial_movie.director = member.get("name")
                break

        # vérifie si c'est le bon film
        score = 0
        if abs(potenial_movie.runtime - movie_ac.runtime) < 10:
            score+=1

        if normalize_name(potenial_movie.director) == normalize_name(movie_ac.director):
            score+=1

        date_ac = datetime.strptime(movie_ac.release_date, "%Y-%m-%d")
        date_tmdb = datetime.strptime(potenial_movie.release_date, "%Y-%m-%d")
        dayDiff = abs((date_ac - date_tmdb).days)
        if(dayDiff < 180):
            score+=1

        if (score > 1):
            movie_tmdb = potenial_movie
            break 

    
    if(movie_tmdb != None):

        # --- film existe via chargement TMDB
        movie_id = DB_Manager.get_movie_id(allocine_id=movie_ac.id)

        if ( movie_id != None):
            DB_Manager.update_movie_TMDB(
                allocine_id=movie_ac.id,
                runtime=movie_ac.runtime,
                release_date=movie_ac.release_date
            )
        
        # --- Film n'existe pas dans la BD
        else:
            # Ajoute le film
            print(f"Charge avec TMDB")

            # Recup les info TMDB du film
            tmdb_movie_info = TMDB_Fetcher.get_movie_details(movie_tmdb.id)

            # Charge le film
            movie_id = DB_Manager.insert_movie_TMDB(tmdb_movie_info,movie_ac)

            # Charge les Genres du film
            for genre in tmdb_movie_info['genres']:
                if not DB_Manager.genre_exists(genre['name']):
                    DB_Manager.insert_genre(genre['name'])
                genre_id = DB_Manager.get_genre_id(genre['name'])
                DB_Manager.insert_movie_genre(movie_id,genre_id)

            # Charge les Company de production du film
            for production_companie in tmdb_movie_info['production_companies']:
                if not DB_Manager.production_companie_exist(production_companie['id']):
                    DB_Manager.insert_production_company(production_companie['id'],production_companie['logo_path'],production_companie['name'])
                DB_Manager.insert_movie_production_company(movie_id, production_companie['id'])

            # Charge les Personnes associé au film
            for crew in tmdb_movie_info['credits']['crew']:
                if crew['job'] == "Director" :
                    person_id = DB_Manager.get_people_id(None, crew['id'], None)
                    if person_id is None:
                        person_id = DB_Manager.insert_people(crew['id'],None,crew['name'],crew['profile_path'])
                    DB_Manager.insert_movie_people(movie_id,person_id, "director")

            # for cast in tmdb_movie_info['credits']['cast'][:5]:
            #     if not DB_Manager.people_exists(cast['id']):
            #         DB_Manager.insert_people(cast['id'],cast['name'],cast['profile_path'])
            #     DB_Manager.insert_movie_people(movie_id,cast['id'], "actor",cast['character'])

    else:
        print(f"Charge avec AC")

        # Charge le Film
        movie_id = DB_Manager.insert_movie_AC(movie_ac)

        # charge le Director


    return movie_id

# -------------------------------------------------------------------------------
# ajout d'une sceance dans la BD
# -------------------------------------------------------------------------------
def add_sessions_to_bd(movie_id, cineID, session):
    startsAt = datetime.fromisoformat(session['startsAt'])
    allocineID = session['internalId']
    projection_list = session.get("projection", [])
    projection = projection_list[0] if projection_list else None
    version = session['diffusionVersion']
    ticketing_list = session.get("data", {}).get("ticketing", [])
    if ticketing_list:
        url_list = ticketing_list[0].get("urls", [])
        booking_url = url_list[0] if url_list else None
    else:
        booking_url = None

    DB_Manager.insert_session(movie_id, cineID, startsAt, projection, version, booking_url, allocineID)

# -------------------------------------------------------------------------------
# Calcule du runtime de allocine
# -------------------------------------------------------------------------------
def allo_cine_runtime_to_minutes(runtime: str) -> int:
    runtime = runtime.replace(" ", "")

    if("h" in runtime.lower()):
        runtimeSplit = runtime.split("h")

        hours = int(runtimeSplit[0])
        if(runtimeSplit[1] == ""):
            minutes = 0
        else:
            runtimeSplit[1] = runtimeSplit[1].replace("min", "")
            minutes = int(runtimeSplit[1])
    else:
        runtimeSplit = runtime.split("min")
        minutes = int(runtimeSplit[0])
        hours = 0

    return hours*60+minutes


# -------------------------------------------------------------------------------
# Main --------------------------------------------------------------------------
# -------------------------------------------------------------------------------
print ("--")
paris_sessions()