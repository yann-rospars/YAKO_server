# tmdb_fetcher.py

import requests
import time
import regex as re
import math

from datetime import datetime

from classes.Film import Film
from classes.Trailer import Trailer
from config.languages import SUPPORTED_LANGUAGES

from tools.tools import normalize_title


class TMDBFetcher:
    def __init__(self):
        self.api_TMDB_key = "987cbce1ac3db60be7ad5660f07b6b84"
        self.Number_Of_Movies_Per_Page = 20

    # --------------------------------------------------------
    # Récupère les films tmdb poteniellement identique au film alllocine
    # --------------------------------------------------------
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

                        if(dayDiff < 1095): # 3 ans
                            potential_movies.append(movie_tmdb)         

        return potential_movies
    
    # --------------------------------------------------------
    # Récupère les données d'un films au format JSON
    # --------------------------------------------------------
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
    
    # --------------------------------------------------------
    # Extrait la liste des trailer d'un film tmdb
    # --------------------------------------------------------
    def extract_tmdb_trailer(self, tmdb_id, vo):
        trailers = []

        for lang_code, lang_cfg in SUPPORTED_LANGUAGES.items():
            tmdb_lang = lang_cfg["tmdb"]
            if tmdb_lang == "vo?":
                tmdb_lang = vo

            url = f"http://api.themoviedb.org/3/movie/{tmdb_id}/videos?api_key={self.api_TMDB_key}&language={tmdb_lang}"
            time.sleep(0.2) 
            response = requests.get(url)

            if response.status_code != 200:
                raise Exception(f"Erreur lors de la récupération des trailer TMDB (code {response.status_code})")
            
            videos = response.json().get("results", [])
            for video in videos:

                # on ignore tout ce qui n'est pas YouTube
                if video.get("site") != "YouTube":
                    continue

                # on ignore tout ce qui n'est pas un Trailer
                if video.get("type") != "Trailer":
                    continue

                # vérifie la clef youtube
                key = video.get("key")
                if not key:
                    continue

                trailer = Trailer(None,tmdb_id,video.get("key"),video.get("type"),lang_code,video.get("iso_3166_1"),video.get("official", False),video.get("size"),video.get("published_at"),False)

                trailers.append(trailer)

        return trailers
    
    # --------------------------------------------------------
    # Extrait la liste des n Films les plus populaires d'une année
    # --------------------------------------------------------
    def get_most_popular_movies_id(self, start_year, end_year, n):
        all_movies = []
        seen = set()

        for year in range(start_year, end_year + 1):
            print(f"Fetching year {year}...")

            # Temporaire 
            if year < 1950 :
                n = 10
            elif year < 1980 : 
                n = 50
            else :
                n = 100

            last_page = math.ceil(n / self.Number_Of_Movies_Per_Page)
            total_pages = 1
            current_page = 1
            count_year = 0

            while current_page <= last_page and current_page <= total_pages:

                url = f"https://api.themoviedb.org/3/discover/movie?api_key={self.api_TMDB_key}&language=fr-FR&primary_release_year={year}&sort_by=popularity.desc&page={current_page}"
                
                try:
                    time.sleep(0.1)
                    response = requests.get(url, timeout=5)
                    response.raise_for_status()
                except requests.exceptions.RequestException as e:
                    print(f"Erreur TMDB année {year}, page {current_page}: {e}")
                    break

                data = response.json()
                movies = data.get("results", [])

                if current_page == 1:
                    total_pages = min(data.get("total_pages", 1), 500)

                for movie in movies:
                    movie_id = movie['id']

                    # anti-doublon global (optionnel mais recommandé)
                    if movie_id not in seen:
                        seen.add(movie_id)
                        all_movies.append(movie_id)
                        count_year += 1

                        if count_year >= n:
                            break

                if count_year >= n:
                    break

                current_page += 1

        return all_movies