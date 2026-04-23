import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

import requests
import json
import csv

from datetime import datetime


from scrapers.TMDBFetcher import TMDBFetcher
from scrapers.SupabaseManager import DBManager
from classes.Film import Film
from tools.tools import normalize_title
from tools.tools import charge_directors_with_TMDB, charge_directors_AC_TMDB
from config.languages import SUPPORTED_LANGUAGES

TMDB_Fetcher = TMDBFetcher()
DB_Manager = DBManager()


# ------------------------------------------------------------------------------
with open("C:/Users/yannb/Documents/Yako/manual_loading/missing_tmdb_movies.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter=";")
    movies_checked =[]

    for row in reader:
        id_db = int(row["movie_id"])
        id_tmdb = row["tmdb_id"]

        # Extraction des données TMDB
        if(id_tmdb == "0"):
            DB_Manager.update_movie_TMDB(id_db, valid_mapping=True)
            movies_checked.append(id_db)
            continue
        elif(id_tmdb == "" or id_tmdb is None):
            continue

        tmdb_movie_info = TMDB_Fetcher.get_movie_details(id_tmdb)
        original_title = tmdb_movie_info['original_title']
        title = tmdb_movie_info["title"]
        is_adult = tmdb_movie_info['adult']
        original_language = tmdb_movie_info['original_language']
        overview = tmdb_movie_info['overview']
        popularity = tmdb_movie_info['popularity']
        poster_path = tmdb_movie_info['poster_path']
        backdrop_path = tmdb_movie_info['backdrop_path']
        release_date = tmdb_movie_info['release_date']
        revenue = tmdb_movie_info['revenue']
        budget = tmdb_movie_info['budget']
        runtime = tmdb_movie_info['runtime']
        vote_average = tmdb_movie_info['vote_average']
        vote_count = tmdb_movie_info['vote_count']
        languages = [lang.get("iso_639_1") for lang in tmdb_movie_info.get("spoken_languages", [])]

        # Extraction des titres de la Base
        db_movie = DB_Manager.get_movie_info(id=id_db)

        # Vérification des Titres 
        norm_title = normalize_title(title)
        norm_original_title = normalize_title(original_title)
        norm_db_title = normalize_title(db_movie.title)
        norm_db_original_title = normalize_title(db_movie.original_title)

        valide = True
        if( norm_title != norm_db_title and norm_original_title != norm_db_original_title):
            print("\n--- Vérification manuelle requise, les titres sont tous différents ! ---")
            print(f"TMDB title        : {norm_title}")
            print(f"TMDB original     : {norm_original_title}")
            print(f"DB Allociné title : {norm_db_title}")
            print(f"DB original       : {norm_db_original_title}")
            
            choix = input("Valider malgré tout ? (y/n) : ").strip().lower()

            if choix != "y":
                valide = False
                print("Film non traié !")

        if valide:
            movies_checked.append(id_db)
            overview = overview if overview not in (None, "") else db_movie.overview
            release_date = db_movie.release_date if db_movie.release_date is not None else release_date
            runtime = db_movie.runtime if db_movie.runtime is not None else runtime

            # Ajout des données TMDB
            DB_Manager.update_movie_TMDB(
                movie_id=id_db,
                tmdb_id=id_tmdb,
                is_adult=is_adult,
                original_language=original_language,
                overview=overview,
                popularity=popularity,
                poster_path=poster_path,
                backdrop_path=backdrop_path,
                release_date=release_date,
                revenue=revenue,
                budget=budget,
                runtime=runtime,
                vote_average=vote_average,
                vote_count=vote_count,
                spoken_languages=languages,
                valid_mapping=True
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

            # Charge les Realisateurs associés au film
            crew = tmdb_movie_info.get("credits", {}).get("crew", [])
            directors = DB_Manager.get_movie_directors(id_db)
            directors = charge_directors_with_TMDB(directors, crew) # mapp les directors des deux sources

            DB_Manager.delete_movie_people_wth_movie(id_db) # Supprime tout les liens du film avec les personnes
            charge_directors_AC_TMDB(DB_Manager,directors,id_db)                    
                        
            # Charge les Trailer associé au film
            trailers = TMDB_Fetcher.extract_tmdb_trailer(id_tmdb,original_language)

            main_trailer = { # Liste des main trailers
                lang_code: None
                for lang_code in SUPPORTED_LANGUAGES.keys()
            }

            for trailer in trailers: # remplies la liste des main trailers
                best_trailer = main_trailer[trailer.language]
                
                # verif Null
                if best_trailer is None :
                    main_trailer[trailer.language] = trailer
                    continue

                # verif Officiel
                if trailer.official and not best_trailer.official :
                    main_trailer[trailer.language] = trailer
                    continue
                if best_trailer.official and not trailer.official :
                    continue

                # verif Size
                if trailer.size >= 1080 and best_trailer.size < 1080 :
                    main_trailer[trailer.language] = trailer
                    continue
                if best_trailer.size >= 1080 and trailer.size < 1080 :
                    continue

                # Choix via date
                if trailer.published_at and best_trailer.published_at:
                    trailer_date = datetime.fromisoformat(trailer.published_at.replace("Z", "+00:00"))
                    best_date = datetime.fromisoformat(best_trailer.published_at.replace("Z", "+00:00"))

                    if trailer_date > best_date:
                        main_trailer[trailer.language] = trailer
                        continue
            
            for trailer in trailers: # insertion des trailers
                if main_trailer[trailer.language] == trailer:
                    trailer.is_main = True
                else:
                    trailer.is_main = False

                DB_Manager.insert_trailer(trailer, id_db)

    # ------------------------------------------------------------
    # Nettoyage du CSV (suppression des films traités)
    # ------------------------------------------------------------
    input_path = "C:/Users/yannb/Documents/Yako/manual_loading/missing_tmdb_movies.csv"

    with open(input_path, newline="", encoding="utf-8") as infile:
        reader = csv.DictReader(infile, delimiter=";")
        fieldnames = reader.fieldnames

        # On garde uniquement les lignes non traitées
        remaining_rows = [
            row for row in reader
            if int(row["movie_id"]) not in movies_checked
        ]

    # Réécriture du même fichier
    with open(input_path, mode="w", newline="", encoding="utf-8") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, delimiter=";")
        writer.writeheader()
        writer.writerows(remaining_rows)

    print("CSV nettoyé directement")