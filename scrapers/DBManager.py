# db_manager.py

import psycopg2
import json

from classes.Film import Film

class DBManager:
    def __init__(self):
        self.conn = psycopg2.connect(
            host="postgresql-rospars.alwaysdata.net",
            database="rospars_yako",
            user="rospars",
            password="Megakiller38%"
        )
        self.cursor = self.conn.cursor()


    def close(self):
        self.cursor.close()
        self.conn.close()

    # ----------------------------------------------
    # Vérification d'existence
    # ----------------------------------------------
    def movie_exists(self, movie_id):
        self.cursor.execute("SELECT 1 FROM movies WHERE id = %s", (movie_id,))
        return self.cursor.fetchone() is not None

    def genre_exists(self, genre_name):
        self.cursor.execute("SELECT 1 FROM genres WHERE genre = %s", (genre_name,))
        return self.cursor.fetchone() is not None
    
    def production_companie_exist(self, companie_id):
        self.cursor.execute("SELECT 1 FROM production_company WHERE id = %s", (companie_id,))
        return self.cursor.fetchone() is not None

    def keyword_exists(self, keyword_id):
        self.cursor.execute("SELECT 1 FROM keywords WHERE id = %s", (keyword_id,))
        return self.cursor.fetchone() is not None

    def people_exists(self, person_id):
        self.cursor.execute("SELECT 1 FROM peoples WHERE id = %s", (person_id,))
        return self.cursor.fetchone() is not None

    def movie_exists_allocineID(self, allocine_id):
        self.cursor.execute("SELECT id FROM movies WHERE allocine_id = %s", (allocine_id,))
        return self.cursor.fetchone()
    
    def session_exists_allocineID(self, allocine_id):
        self.cursor.execute("SELECT id FROM sessions WHERE allocine_id = %s", (allocine_id,))
        return self.cursor.fetchone()
    
    # ----------------------------------------------
    # Ajout de données
    # ----------------------------------------------
    def insert_movie_TMDB(self, movie, movie_ac):
        try:
            self.cursor.execute("""
                INSERT INTO movies (
                    allocine_id, tmdb_id, title, original_title, is_adult, original_language, overview, popularity, 
                    poster_path, release_date, revenue, budget, runtime, 
                    vote_average, vote_count, spoken_languages
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                movie_ac.id, movie['id'], movie['title'], movie['original_title'], movie['adult'], movie['original_language'],
                movie['overview'], movie['popularity'], movie['poster_path'],
                movie_ac.release_date, movie['revenue'], movie['budget'], movie_ac.runtime,
                movie['vote_average'], movie['vote_count'], [lang.get("iso_639_1") for lang in movie.get("spoken_languages", [])]
            ))
            movie_id = self.cursor.fetchone()[0]
            self.conn.commit()
            return movie_id
            
        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion du film : {e}")
            return None

    def insert_movie_AC(self,movie_ac):
        try:
            self.cursor.execute("""
                INSERT INTO movies (
                    allocine_id, title, original_title, overview, release_date, runtime, poster_path
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                movie_ac.id, movie_ac.title, movie_ac.original_title, movie_ac.overview, movie_ac.release_date, movie_ac.runtime, movie_ac.poster_path
            ))
            movie_id = self.cursor.fetchone()[0]
            self.conn.commit()
            return movie_id
        
        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion du film : {e}")
            return None

    # -- Genres
    def insert_genre(self, name):
        try:
            self.cursor.execute("INSERT INTO genres (genre) VALUES (%s)", (name,))
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion du genre : {e}")

    def insert_movie_genre(self, movie_id, genre_id):
        try:
            self.cursor.execute("INSERT INTO movie_genre (movie_id, genre_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (movie_id, genre_id))
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion du lien film-genre : {e}")

    # -- Company
    def insert_production_company(self, company_id, logo, name):
        try:
            self.cursor.execute("INSERT INTO production_company (id, logo, production_company) VALUES (%s, %s, %s)", (company_id, logo, name))
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion du genre : {e}")

    def insert_movie_production_company(self, movie_id, company_id):
        try:
            self.cursor.execute("INSERT INTO movie_production_company (movie_id, company_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (movie_id, company_id))
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion du lien film-genre : {e}")

    # -- Keyword
    def insert_keyword(self, keyword_id, name):
        try:
            self.cursor.execute("INSERT INTO keywords (id, keyword) VALUES (%s, %s)", (keyword_id, name))
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion du mot-clé : {e}")

    # -- People
    def insert_people(self, tmdb_id, ac_id, name, profile_path):
        try:
            self.cursor.execute("""
                INSERT INTO peoples (tmdb_id, allocine_id, name, profile_path)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (tmdb_id, ac_id, name, profile_path))
            
            person_id = self.cursor.fetchone()[0]
            self.conn.commit()
            return person_id

        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion de la personne : {e}")
            return None

    def insert_movie_people(self, movie_id, person_id, role_type, character=None):
        try:
            self.cursor.execute("INSERT INTO movie_people (movie_id, person_id, role_type, character) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING", (movie_id, person_id, role_type, character))
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de l'insertion du lien film-genre : {e}")

    # -- Session
    def insert_session(self, movie_id, cinema_id, startsAt, projection=None, version=None, booking_url=None, allocine_id=None):
        try:
            self.cursor.execute("""
                INSERT INTO sessions (
                    movie_id, cinema_id, startsAt, projection,
                    version, booking_url, allocine_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (movie_id,cinema_id,startsAt,projection,version,booking_url,allocine_id))
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(f"Error inserting session: {e}")


    # ----------------------------------------------
    # Recherche de données
    # ----------------------------------------------
    def get_movie_id(self, tmdb_id=None, allocine_id=None):
        try:
            if tmdb_id:
                self.cursor.execute("SELECT id FROM movies WHERE tmdb_id = %s", (tmdb_id,))
            else:
                self.cursor.execute("SELECT id FROM movies WHERE allocine_id = %s", (allocine_id,))

            result = self.cursor.fetchone()
            if result:
                return result[0]
            else:
                return None

        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de la récupération de l'id du film : {e}")
            return None

        
    def get_cinemas(self):
        try:
            self.cursor.execute("SELECT id, name, address, image, wherefind, idallocine FROM cinemas")
            rows = self.cursor.fetchall()

            # Transformation en liste de dictionnaires
            cinemas = []
            for row in rows:
                cinema = {
                    "id": row[0],
                    "name": row[1],
                    "address": row[2],
                    "image": row[3],
                    "wherefind": row[4],
                    "idallocine": row[5]
                }
                cinemas.append(cinema)
            return cinemas
        except Exception as e:
            print(f"Erreur lors de la récupération des cinémas : {e}")
            return []
        
    def get_genre_id(self, genre):
        try:
            self.cursor.execute("SELECT id FROM genres WHERE genre = %s", (genre,))
            result = self.cursor.fetchone()
            return result[0] if result else None
        except Exception as e:
            print(f"Erreur lors de la recherche du genre : {e}")
            return None
        
    def get_people_id(self, id=None, tmdb_id=None, allocine_id=None):
        result = None

        if id is not None:
            self.cursor.execute("SELECT id FROM peoples WHERE id = %s", (id,))
            result = self.cursor.fetchone()
        elif tmdb_id is not None:
            self.cursor.execute("SELECT id FROM peoples WHERE tmdb_id = %s", (tmdb_id,))
            result = self.cursor.fetchone()
        elif allocine_id is not None:
            self.cursor.execute("SELECT id FROM peoples WHERE allocine_id = %s", (allocine_id,))
            result = self.cursor.fetchone()

        if result is not None:
            return result[0]

        return None
        
    # ----------------------------------------------
    # Modifie les données
    # ----------------------------------------------
    def update_movie_TMDB(self, movie_id, **kwargs):
        try:
            # Filtre uniquement les colonnes autorisées dans la table
            valid_columns = [
                "allocine_id", "tmdb_id", "title", "original_title", "is_adult",
                "original_language", "overview", "en_overview", "popularity",
                "poster_path", "release_date", "revenue", "budget", "runtime",
                "vote_average", "vote_count", "spoken_languages"
            ]
            
            # On garde seulement les champs valides et non None
            updates = {k: v for k, v in kwargs.items() if k in valid_columns and v is not None}
            
            if not updates:
                print("Aucun champ à mettre à jour.")
                return False

            # Construction dynamique de la requête SQL
            set_clause = ", ".join([f"{col} = %s" for col in updates.keys()])
            values = list(updates.values())
            values.append(movie_id)

            query = f"UPDATE movies SET {set_clause} WHERE id = %s"

            self.cursor.execute(query, values)
            self.conn.commit()

            print(f"Film (id={movie_id}) mis à jour avec succès : {', '.join(updates.keys())}")
            return True

        except Exception as e:
            self.conn.rollback()
            print(f"Erreur lors de la mise à jour du film (id={movie_id}) : {e}")
            return False

