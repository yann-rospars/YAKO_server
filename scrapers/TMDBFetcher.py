# tmdb_fetcher.py

import requests
import time
import regex as re

from datetime import datetime

from classes.Film import Film
from tools.tools import normalize_title

class TMDBFetcher:
    def __init__(self):
        self.api_TMDB_key = "987cbce1ac3db60be7ad5660f07b6b84"

    # Récupère l'ID TMDB des films poteniellement identique (prend en compte : titre , date)
    def get_potentials_movies_tmdb(self, movie_ac):
        potential_movies = []
        nb_pages = 1
        page = 1

        while page <= nb_pages:

            url = f"https://api.themoviedb.org/3/search/movie?api_key={self.api_TMDB_key}&query={movie_ac.title}&language=fr-FR&page={page}"
            time.sleep(0.2)  # Respecter le taux de requêtes
            response = requests.get(url)
            data = response.json()

            nb_pages = data.get('total_pages')
            page +=1

            for movie_data in data.get('results', []):
                movie_tmdb = Film.from_tmdb_no_details(movie_data)

                # --- Nettoyage des titres avant comparaison ---
                tmdb_title = normalize_title(movie_tmdb.title)
                ac_title = normalize_title(movie_ac.title)
                tmdb_original_title = normalize_title(movie_tmdb.original_title)
                ac_original_title = normalize_title(movie_ac.original_title)

                if (tmdb_title == ac_title or tmdb_original_title == ac_original_title):
                    if movie_ac.release_date and movie_tmdb.release_date:
                        try:
                            date_ac = datetime.strptime(movie_ac.release_date, "%Y-%m-%d")
                            date_tmdb = datetime.strptime(movie_tmdb.release_date, "%Y-%m-%d")
                        except ValueError:
                            continue # si le format n'est pas valide

                        dayDiff = abs((date_ac - date_tmdb).days)

                        if(dayDiff < 1095): # 3ans
                            potential_movies.append(movie_tmdb)         

        return potential_movies
    
    # Récupère les données d'un films au format JSON
    def get_movie_details(self, movie_id):
        url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={self.api_TMDB_key}&append_to_response=credits&language=fr-FR"

        time.sleep(0.2) 
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Erreur lors de la récupération du film TMDB (code {response.status_code})")
        return response.json()
    
    # --------------------------------------------------------
    # Extrait la liste de nom de Director depuis les données crew TMDB
    # --------------------------------------------------------
    @staticmethod
    def extract_tmdb_director_names(crew):
        tmdb_names = []

        for member in crew:
            if member.get("job") == "Director":
                name = member.get("name")
                if name:
                    tmdb_names.append(name)

        return tmdb_names

