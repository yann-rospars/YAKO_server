# tmdb_fetcher.py

import requests
import time
import regex as re

from datetime import datetime

from classes.Film import Film

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

            for movie in data.get('results', []):
                movie_tmdb = Film.from_tmdb(movie)

                # --- Nettoyage des titres avant comparaison ---
                tmdb_title = re.sub(r"[^\p{L}\p{N}\s]", "", movie_tmdb.title)
                tmdb_title = re.sub(r"\s+", " ", tmdb_title).strip().lower()

                ac_title = re.sub(r"[^\p{L}\p{N}\s]", "", movie_ac.title)
                ac_title = re.sub(r"\s+", " ", ac_title).strip().lower()

                tmdb_original_title = re.sub(r"[^\p{L}\p{N}\s]", "", movie_tmdb.original_title)
                tmdb_original_title = re.sub(r"\s+", " ", tmdb_original_title).strip().lower()

                ac_original_title = re.sub(r"[^\p{L}\p{N}\s]", "", movie_ac.original_title)
                ac_original_title = re.sub(r"\s+", " ", ac_original_title).strip().lower()

                if (tmdb_title == ac_title or tmdb_original_title == ac_original_title):
                    if movie_ac.release_date and movie_tmdb.release_date:
                        try:
                            date_ac = datetime.strptime(movie_ac.release_date, "%Y-%m-%d")
                            date_tmdb = datetime.strptime(movie_tmdb.release_date, "%Y-%m-%d")
                        except ValueError:
                            continue # si le format n'est pas valide

                        dayDiff = abs((date_ac - date_tmdb).days)

                        if(dayDiff < 300):
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
    

