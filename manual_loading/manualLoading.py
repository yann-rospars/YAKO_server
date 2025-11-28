import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

import requests
import json
import csv

from scrapers.TMDBFetcher import TMDBFetcher
from scrapers.DBManager import DBManager
from classes.Film import Film
from tools.tools import normalize_title
from tools.tools import charge_directors_with_TMDB


TMDB_Fetcher = TMDBFetcher()
DB_Manager = DBManager()


# ------------------------------------------------------------------------------
with open("C:/Users/yannb/Documents/Yako/manual_loading/mapping_movies.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter=";")

    for row in reader:
        id_db = row["DB ID"]
        id_tmdb = row["TMDB ID"]

        # Extraction des données TMDB
        tmdb_movie_info = TMDB_Fetcher.get_movie_details(id_tmdb)
        original_title = tmdb_movie_info['original_title']
        title = tmdb_movie_info["title"]
        is_adult = tmdb_movie_info['adult']
        original_language = tmdb_movie_info['original_language']
        overview = tmdb_movie_info['overview']
        popularity = tmdb_movie_info['popularity']
        poster_path = tmdb_movie_info['poster_path']
        revenue = tmdb_movie_info['revenue']
        budget = tmdb_movie_info['budget']
        vote_average = tmdb_movie_info['vote_average']
        vote_count = tmdb_movie_info['vote_count']
        languages = [lang.get("iso_639_1") for lang in tmdb_movie_info.get("spoken_languages", [])]

        # Extraction des titres de la Base
        db_title, db_original_title = DB_Manager.get_movie_titles(id=id_db)

        # Vérification des Titres 
        norm_title = normalize_title(title)
        norm_original_title = normalize_title(original_title)
        norm_db_title = normalize_title(db_title)
        norm_db_original_title = normalize_title(db_original_title)

        valide = True
        if( norm_title != norm_db_title and norm_original_title != norm_db_original_title):
            print("\n--- Vérification manuelle requise, les titres sont tous différents ! ---")
            print(f"TMDB title        : {norm_title}")
            print(f"TMDB original     : {norm_original_title}")
            print(f"DB Allociné title : {norm_db_title}")
            print(f"DB original       : {norm_db_original_title}")
            
            choix = input("Valider malgré tout ? (yes/no) : ").strip().lower()

            if choix != "yes":
                valide = False

        if valide:
            # Ajout des données TMDB
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

            # Charge les Genres du film
            for genre in tmdb_movie_info['genres']:
                if not DB_Manager.genre_exists(genre['name']):
                    DB_Manager.insert_genre(genre['name'])
                genre_id = DB_Manager.get_genre_id(genre['name'])
                DB_Manager.insert_movie_genre(id_db,genre_id)

            # Charge les Company de production du film
            for production_companie in tmdb_movie_info['production_companies']:
                if not DB_Manager.production_companie_exist(production_companie['id']):
                    DB_Manager.insert_production_company(production_companie['id'],production_companie['logo_path'],production_companie['name'])
                DB_Manager.insert_movie_production_company(id_db, production_companie['id'])

            # Charge les Personnes associé au film
            crew = tmdb_movie_info.get("credits", {}).get("crew", [])
            directors = DB_Manager.get_movie_directors(id_db)
            directors = charge_directors_with_TMDB(directors, crew)

            DB_Manager.delete_movie_people_wth_movie(id_db) # Supprime tout les liens du film avec les personnes

            for director in directors:

                # Suprime si le directeur est sans lien avec des film
                if(director.id_ac is not None):
                    if not DB_Manager.movie_people_exists_wth_person(director.id):
                        DB_Manager.delete_people(director.id)

                # On charge les réalisateurs
                if (director.id_tmdb is not None):
                    if(director.id_ac is not None):
                        person_id_1 = DB_Manager.get_people_id(None, director.id_tmdb, None)     
                        person_id_2 = DB_Manager.get_people_id(None, None, director.id_ac)

                        if person_id_1 is None and person_id_2 is None: # Le director n'est pas dans la BD
                            person_id = DB_Manager.insert_people(director.id_tmdb,director.id_ac,director.name,director.profile_path)
                        elif person_id_1 is not None and person_id_2 is None: # Le director est dans la BD avec l'id TMDB
                            person_id = person_id_1
                            DB_Manager.update_people(person_id,allocine_id=director.id_ac)
                        elif person_id_2 is not None and person_id_1 is None: # Le director est dans la BD avec l'id Allocine
                            person_id = person_id_2
                            DB_Manager.update_people(person_id,tmdb_id=director.id_tmdb,profile_path=director.profile_path)
                        elif person_id_2 == person_id_1 : # Le directeur est déjà entier dans la BD
                            person_id = person_id_1
                        else : # Il y'a deux version du director dans la BD (On garde le people chargé avec TMDB)
                            person_id = person_id_1
                            DB_Manager.update_people(person_id,allocine_id=director.id_ac)
                            DB_Manager.update_movie_people_director(person_id_2,person_id) # (old, new)
                            DB_Manager.delete_director(person_id_2)

                    else :
                        person_id_1 = DB_Manager.get_people_id(None, director.id_tmdb, None)  
                        if person_id_1 is None : # Le director n'est pas dans la BD
                            person_id = DB_Manager.insert_people(director.id_tmdb,None,director.name,director.profile_path)
                        else :
                            person_id = person_id_1
                        
                    DB_Manager.insert_movie_people(id_db,person_id,"director",None)

                        
