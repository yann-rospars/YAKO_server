# db_manager.py

from supabase import create_client
import os

import psycopg2
import json

from classes.Film import Film
from classes.Director import Director

class DBManager:
    def __init__(self):
        # Home > Section API > View API Setings > API Key 
        self.supabase = create_client("https://hkhmipoxoetjzplqjctr.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraG1pcG94b2V0anpwbHFqY3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMDY1NywiZXhwIjoyMDc5OTA2NjU3fQ.FnTtDb1oSEhr1-Lky81jep4lBhnFJs9-6hgejFgACVo")


    def close(self):
        pass  # Supabase n'utilise pas de connexion persistante

    # ----------------------------------------------
    # Check if exist
    # ----------------------------------------------
    def movie_exists(self, movie_id):
        res = (
            self.supabase
            .table("movies")
            .select("id")
            .eq("id", movie_id)
            .limit(1)
            .execute()
        )
        return len(res.data) > 0

    def genre_exists(self, genre_name):
        res = (
            self.supabase
            .table("genres")
            .select("id")
            .eq("genre", genre_name)
            .limit(1)
            .execute()
        )
        return len(res.data) > 0

    def production_companie_exist(self, companie_id):
        res = (
            self.supabase
            .table("production_company")
            .select("id")
            .eq("id", companie_id)
            .limit(1)
            .execute()
        )
        return len(res.data) > 0

    def keyword_exists(self, keyword_id):
        res = (
            self.supabase
            .table("keywords")
            .select("id")
            .eq("id", keyword_id)
            .limit(1)
            .execute()
        )
        return len(res.data) > 0

    def people_exists(self, person_id):
        res = (
            self.supabase
            .table("peoples")
            .select("id")
            .eq("id", person_id)
            .limit(1)
            .execute()
        )
        return len(res.data) > 0

    def movie_exists_allocineID(self, allocine_id):
        res = (
            self.supabase
            .table("movies")
            .select("id")
            .eq("allocine_id", allocine_id)
            .limit(1)
            .execute()
        )
        if res.data:
            return (res.data[0]["id"],)  # ⚠️ tuple comme psycopg2
        return None

    def session_exists_allocineID(self, allocine_id):
        res = (
            self.supabase
            .table("sessions")
            .select("id")
            .eq("allocine_id", allocine_id)
            .limit(1)
            .execute()
        )
        if res.data:
            return (res.data[0]["id"],)
        return None

    def movie_people_exists_wth_person(self, person_id):
        res = (
            self.supabase
            .table("movie_people")
            .select("person_id")
            .eq("person_id", person_id)
            .limit(1)
            .execute()
        )
        if res.data:
            return (res.data[0]["person_id"],)
        return None

    # ----------------------------------------------
    # Insert
    # ----------------------------------------------

    def insert_movie_TMDB(self, movie, movie_ac):

        overview = movie['overview'] if movie['overview'] is not None else movie_ac.overview
        release_date = movie_ac.release_date if movie_ac.release_date is not None else movie['release_date']
        runtime = movie_ac.runtime if movie_ac.runtime is not None else movie['runtime']

        try:
            data = {
                "allocine_id": movie_ac.allocine_id,
                "tmdb_id": movie["id"],
                "title": movie["title"],
                "original_title": movie["original_title"],
                "is_adult": movie["adult"],
                "original_language": movie["original_language"],
                "overview": overview,
                "popularity": movie["popularity"],
                "poster_path": movie["poster_path"],
                "backdrop_path": movie["backdrop_path"],
                "release_date": release_date,
                "revenue": movie["revenue"],
                "budget": movie["budget"],
                "runtime": runtime,
                "vote_average": movie["vote_average"],
                "vote_count": movie["vote_count"],
                "spoken_languages": [
                    lang.get("iso_639_1")
                    for lang in movie.get("spoken_languages", [])
                ]
            }

            res = (
                self.supabase
                .table("movies")
                .insert(data)
                .execute()
            )

            return res.data[0]["id"]

        except Exception as e:
            print(f"Erreur lors de l'insertion du film : {e}")
            return None

    def insert_movie_AC(self, movie_ac):
        try:
            res = (
                self.supabase
                .table("movies")
                .insert({
                    "allocine_id": movie_ac.allocine_id,
                    "title": movie_ac.title,
                    "original_title": movie_ac.original_title,
                    "overview": movie_ac.overview,
                    "release_date": movie_ac.release_date,
                    "runtime": movie_ac.runtime,
                    "poster_path": movie_ac.poster_path
                })
                .execute()
            )

            return res.data[0]["id"]

        except Exception as e:
            print(f"Erreur lors de l'insertion du film : {e}")
            return None

    # -- Genres
    def insert_genre(self, name):
        try:
            self.supabase.table("genres").insert({
                "genre": name
            }).execute()
        except Exception as e:
            print(f"Erreur lors de l'insertion du genre : {e}")

    def insert_movie_genre(self, movie_id, genre_id):
        try:
            self.supabase.table("movie_genre").upsert(
                {
                    "movie_id": movie_id,
                    "genre_id": genre_id
                },
                on_conflict="movie_id,genre_id"
            ).execute()
        except Exception as e:
            print(f"Erreur lors de l'insertion du lien film-genre : {e}")

    # -- Company
    def insert_production_company(self, company_id, logo, name):
        try:
            self.supabase.table("production_company").insert({
                "id": company_id,
                "logo": logo,
                "production_company": name
            }).execute()
        except Exception as e:
            print(f"Erreur lors de l'insertion de la société : {e}")

    def insert_movie_production_company(self, movie_id, company_id):
        try:
            self.supabase.table("movie_production_company").upsert(
                {
                    "movie_id": movie_id,
                    "company_id": company_id
                },
                on_conflict="movie_id,company_id"
            ).execute()
        except Exception as e:
            print(f"Erreur lors de l'insertion du lien film-société : {e}")

    # -- Keyword
    def insert_keyword(self, keyword_id, name):
        try:
            self.supabase.table("keywords").insert({
                "id": keyword_id,
                "keyword": name
            }).execute()
        except Exception as e:
            print(f"Erreur lors de l'insertion du mot-clé : {e}")

    # -- People
    def insert_people(self, tmdb_id, ac_id, name, profile_path):
        try:
            res = (
                self.supabase
                .table("peoples")
                .insert({
                    "tmdb_id": tmdb_id,
                    "allocine_id": ac_id,
                    "name": name,
                    "profile_path": profile_path
                })
                .execute()
            )

            return res.data[0]["id"]

        except Exception as e:
            print(f"Erreur lors de l'insertion de la personne : {e}")
            return None

    def insert_movie_people(self, movie_id, person_id, role_type, character=None):
        try:
            self.supabase.table("movie_people").upsert(
                {
                    "movie_id": movie_id,
                    "person_id": person_id,
                    "role_type": role_type,
                    "character": character
                },
                on_conflict="movie_id,person_id,role_type"
            ).execute()
        except Exception as e:
            print(f"Erreur lors de l'insertion du lien film-personne : {e}")

    # -- Session
    def insert_session(self, movie_id, cinema_id, startsAt, projection=None, version=None, booking_url=None, allocine_id=None):
        try:
            self.supabase.table("sessions").upsert(
                {
                    "movie_id": movie_id,
                    "cinema_id": cinema_id,
                    "startsat": startsAt.isoformat() if startsAt else None,
                    "projection": projection,
                    "version": version,
                    "booking_url": booking_url,
                    "allocine_id": allocine_id
                },
                on_conflict="allocine_id"
            ).execute()
        except Exception as e:
            print(f"Error inserting session: {e}")

    # -- Trailer
    def insert_trailer(self, trailer, movie_id):
        try:
            self.supabase.table("movie_trailers").upsert(
                {
                    "movie_id": movie_id,
                    "youtube_key": trailer.youtube_key,
                    "trailer_type": trailer.trailer_type,
                    "language": trailer.language,
                    "region": trailer.region,
                    "official": trailer.official,
                    "size": trailer.size,
                    "published_at": trailer.published_at,
                    "is_main": trailer.is_main
                },
                on_conflict="youtube_key"
            ).execute()
        except Exception as e:
            print(f"Error inserting trailer: {e}")



    # ----------------------------------------------
    # GET Info
    # ----------------------------------------------

    def get_movie_id(self, tmdb_id=None, allocine_id=None):
        try:
            if tmdb_id is not None:
                res = (
                    self.supabase
                    .table("movies")
                    .select("id")
                    .eq("tmdb_id", tmdb_id)
                    .limit(1)
                    .execute()
                )
            else:
                res = (
                    self.supabase
                    .table("movies")
                    .select("id")
                    .eq("allocine_id", allocine_id)
                    .limit(1)
                    .execute()
                )

            if res.data:
                return res.data[0]["id"]
            return None

        except Exception as e:
            print(f"Erreur lors de la récupération de l'id du film : {e}")
            return None


    def get_cinemas(self):
        try:
            res = (
                self.supabase
                .table("cinemas")
                .select("id,name,address,image,wherefind,idallocine")
                .execute()
            )

            cinemas = []
            for row in res.data:
                cinemas.append({
                    "id": row["id"],
                    "name": row["name"],
                    "address": row["address"],
                    "image": row["image"],
                    "wherefind": row["wherefind"],
                    "idallocine": row["idallocine"]
                })

            return cinemas

        except Exception as e:
            print(f"Erreur lors de la récupération des cinémas : {e}")
            return []


    def get_genre_id(self, genre):
        try:
            res = (
                self.supabase
                .table("genres")
                .select("id")
                .eq("genre", genre)
                .limit(1)
                .execute()
            )
            return res.data[0]["id"] if res.data else None

        except Exception as e:
            print(f"Erreur lors de la recherche du genre : {e}")
            return None


    def get_people_id(self, id=None, tmdb_id=None, allocine_id=None):
        try:
            query = self.supabase.table("peoples").select("id").limit(1)

            if id is not None:
                query = query.eq("id", id)
            elif tmdb_id is not None:
                query = query.eq("tmdb_id", tmdb_id)
            elif allocine_id is not None:
                query = query.eq("allocine_id", allocine_id)
            else:
                return None

            res = query.execute()

            if res.data:
                return res.data[0]["id"]
            return None

        except Exception:
            return None


    def get_movie_info(self, id=None, tmdb_id=None, allocine_id=None):
        try:
            query = self.supabase.table("movies").select("*").limit(1)

            if id is not None:
                query = query.eq("id", id)
            elif tmdb_id is not None:
                query = query.eq("tmdb_id", tmdb_id)
            elif allocine_id is not None:
                query = query.eq("allocine_id", allocine_id)
            else:
                return None

            res = query.execute()

            if not res.data:
                return None

            movie_dict = res.data[0]

            film = Film(
                id=movie_dict["id"],
                allocine_id=movie_dict["allocine_id"],
                tmdb_id=movie_dict["tmdb_id"],
                title=movie_dict["title"],
                original_title=movie_dict["original_title"],
                is_adult=movie_dict["is_adult"],
                original_language=movie_dict["original_language"],
                overview=movie_dict["overview"],
                popularity=movie_dict["popularity"],
                poster_path=movie_dict["poster_path"],
                release_date=movie_dict["release_date"],
                revenue=movie_dict["revenue"],
                budget=movie_dict["budget"],
                runtime=movie_dict["runtime"],
                vote_average=movie_dict["vote_average"],
                vote_count=movie_dict["vote_count"],
                spoken_languages=movie_dict["spoken_languages"]
            )

            return film

        except Exception as e:
            print(f"Erreur lors de la récupération du film : {e}")
            return None


    def get_movie_directors(self, movie_id: int):
        try:
            res = (
                self.supabase
                .table("movie_people")
                .select(
                    "peoples(id, allocine_id, tmdb_id, name, profile_path)"
                )
                .eq("movie_id", movie_id)
                .eq("role_type", "director")
                .execute()
            )

            directors = []

            for row in res.data:
                p = row["peoples"]
                director = Director(
                    id=p["id"],
                    id_ac=p["allocine_id"],
                    id_tmdb=p["tmdb_id"],
                    name=p["name"],
                    profile_path=p["profile_path"]
                )
                directors.append(director)

            return directors

        except Exception as e:
            print(f"Erreur lors de la récupération des réalisateurs : {e}")
            return []

    # ----------------------------------------------
    # Update
    # ----------------------------------------------

    def update_movie_TMDB(self, movie_id, **kwargs):
        try:
            valid_columns = [
                "allocine_id", "tmdb_id", "title", "original_title", "is_adult",
                "original_language", "overview", "en_overview", "popularity",
                "poster_path", "release_date", "revenue", "budget", "runtime",
                "vote_average", "vote_count", "spoken_languages"
            ]

            # On garde uniquement les champs valides et non None
            updates = {
                k: v for k, v in kwargs.items()
                if k in valid_columns and v is not None
            }

            if not updates:
                print("Aucun champ à mettre à jour.")
                return False

            self.supabase.table("movies") \
                .update(updates) \
                .eq("id", movie_id) \
                .execute()

            print(
                f"Film (id={movie_id}) mis à jour avec succès : "
                f"{', '.join(updates.keys())}"
            )
            return True

        except Exception as e:
            print(f"Erreur lors de la mise à jour du film (id={movie_id}) : {e}")
            return False


    def update_people(self, person_id, tmdb_id=None, allocine_id=None, name=None, profile_path=None):
        updates = {}

        if allocine_id is not None:
            updates["allocine_id"] = allocine_id

        if tmdb_id is not None:
            updates["tmdb_id"] = tmdb_id

        if name is not None:
            updates["name"] = name

        if profile_path is not None:
            updates["profile_path"] = profile_path

        if not updates:
            return

        try:
            self.supabase.table("peoples") \
                .update(updates) \
                .eq("id", person_id) \
                .execute()

        except Exception as e:
            print(f"Erreur lors de la mise à jour de la personne : {e}")


    def update_movie_people_director(self, old_person_id, new_person_id):
        """
        Remplace old_person_id par new_person_id dans movie_people.
        Utile pour fusionner deux entrées peoples.
        """
        try:
            self.supabase.table("movie_people") \
                .update({"person_id": new_person_id}) \
                .eq("person_id", old_person_id) \
                .execute()

        except Exception as e:
            print(f"Erreur update_movie_people : {e}")


    # ----------------------------------------------
    # Delete
    # ----------------------------------------------

    def delete_people(self, person_id):
        try:
            self.supabase.table("peoples") \
                .delete() \
                .eq("id", person_id) \
                .execute()

        except Exception as e:
            print(f"Erreur delete_people : {e}")


    def delete_movie_people_wth_all(self, movie_id, person_id, role_type):
        try:
            self.supabase.table("movie_people") \
                .delete() \
                .eq("movie_id", movie_id) \
                .eq("person_id", person_id) \
                .eq("role_type", role_type) \
                .execute()

        except Exception as e:
            print(f"Erreur delete movie_people : {e}")


    def delete_movie_people_wth_movie(self, movie_id):
        try:
            self.supabase.table("movie_people") \
                .delete() \
                .eq("movie_id", movie_id) \
                .execute()

        except Exception as e:
            print(f"Erreur delete movie_people : {e}")

