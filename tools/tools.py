import unicodedata
import regex as re
from datetime import date, timedelta, datetime


from classes.Director import Director
from classes.Trailer import Trailer

from config.languages import SUPPORTED_LANGUAGES


# --------------------------------------------------------
# Normalise les nom pour etre comparable
# --------------------------------------------------------
def normalize_name(name: str) -> str:
    if not name:
        return ""

    # Supprime les accents (é → e, ç → c, ă → a, etc.)
    name = unicodedata.normalize('NFD', name)
    name = name.encode('ascii', 'ignore').decode('utf-8')

    # Met en minuscules et supprime les espaces superflus
    name = name.lower().strip()

    return name

# --------------------------------------------------------
# Extrait la liste de Director avec leur données depuis les données AC
# --------------------------------------------------------
def charge_directors_with_AC(allocine_data) -> list[Director]:
    directors = [] # liste de Director
    credits = allocine_data.get("credits", [])

    if isinstance(credits, list):
        for credit in credits:
            position = credit.get("position", {})
            if position.get("name") == "DIRECTOR":

                person = credit.get("person", {})

                # Récupère les noms avec sécurité
                first_name = person.get("firstName") or ""
                last_name = person.get("lastName") or ""

                first_name = str(first_name).strip()
                last_name = str(last_name).strip()

                #ID Allociné s'il existe
                internal_id = person.get("internalId")

                # Combine les deux noms uniquement s’il y en a au moins un
                if (first_name or last_name) and internal_id:
                    full_name = f"{first_name} {last_name}".strip()
                else :
                    continue

                directors.append(Director(
                    id=None,
                    id_ac=internal_id,
                    id_tmdb=None,
                    name=full_name,
                    profile_path=None
                ))

    return directors

# --------------------------------------------------------
# Extrait la liste de Director avec leur données depuis les données TMDB
# --------------------------------------------------------
def charge_directors_with_TMDB(directors, crew):

    ac_map = { normalize_name(d.name): d for d in directors if d.name }

    for member in crew:
        if member.get("job") != "Director":
            continue

        name = member.get("name")
        id_tmdb = member.get("id")
        profile_path = member.get("profile_path")

        if not name or not id_tmdb:
            continue

        norm = normalize_name(name)

        if norm in ac_map:
            existing = ac_map[norm]
            existing.id_tmdb = id_tmdb
            existing.profile_path = profile_path
        else:
            directors.append(Director(
                id=None,
                id_ac=None,
                id_tmdb=id_tmdb,
                name=name,
                profile_path=profile_path
            ))

    return directors

# --------------------------------------------------------
# Methode de jointure et d'ajout des directors AC et TMDB
# --------------------------------------------------------
def charge_directors_AC_TMDB(DB_Manager, directors, movie_id):
    for director in directors: # Pour chaque director 

        if (director.id_tmdb is not None): # Verifie si le director existe dans TMDB
            if(director.id_ac is not None): # Verifie si le director existe dans AC

                # -- Récupération des id dans la base Supabase
                person_id_1 = DB_Manager.get_people_id(None, director.id_tmdb, None)     
                person_id_2 = DB_Manager.get_people_id(None, None, director.id_ac)

                # -- Logique de creation 
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
                    DB_Manager.update_movie_people_director(person_id_2,person_id) # (old, new)
                    DB_Manager.delete_people(person_id_2)
                    DB_Manager.update_people(person_id,allocine_id=director.id_ac)

            else :
                person_id_1 = DB_Manager.get_people_id(None, director.id_tmdb, None)  
                if person_id_1 is None : # Le director n'est pas dans la BD
                    person_id = DB_Manager.insert_people(director.id_tmdb,None,director.name,director.profile_path)
                else :
                    person_id = person_id_1

            # Ajout de la liaison Movie-Director si besoin
            if not DB_Manager.movie_people_exists(movie_id,person_id,"director"):
                DB_Manager.insert_movie_people(movie_id,person_id,"director",None)

# --------------------------------------------------------
# Compare deux liste de nom (de director par exemple)
# --------------------------------------------------------
def compare_directors(ac_list, tmdb_list):
    ac_set   = {normalize_name(n) for n in (ac_list or []) if n}
    tmdb_set = {normalize_name(n) for n in (tmdb_list or []) if n}

    # cas 1 : une liste est vide ou les deux
    if not ac_set or not tmdb_set:
        return -5

    # cas 2 : parfaitement similaire
    if ac_set == tmdb_set:
        return 1

    # cas 3 : inclusion (match partiel crédible)
    if ac_set.issubset(tmdb_set) or tmdb_set.issubset(ac_set):
        return 0

    # cas 4 : non vides et trop différents
    return -5

# --------------------------------------------------------
# Normalise un Titre
# --------------------------------------------------------
def normalize_title(title: str) -> str:
    if not title:
        return ""
    
    cleaned = re.sub(r"[^\p{L}\p{N}\s]", "", title) # Supprimer les caractères non lettres/non chiffres
    cleaned = re.sub(r"\s+", " ", cleaned).strip().lower() # Normaliser les espaces
    return cleaned # En minuscule


# --------------------------------------------------------
# Ajoute l'ethiquete de "Main Trailer" à une liste de trailer fournie
# --------------------------------------------------------
def add_isMainTrailer_info(trailers) :

    main_trailer = {
        lang_code: None
        for lang_code in SUPPORTED_LANGUAGES.keys()
    }

    for trailer in trailers:
        if trailer.language not in main_trailer:
            continue

        best_trailer = main_trailer[trailer.language]

        if best_trailer is None:
            main_trailer[trailer.language] = trailer
            continue

        # Official
        if trailer.official and not best_trailer.official:
            main_trailer[trailer.language] = trailer
            continue
        if best_trailer.official and not trailer.official:
            continue

        # Size
        size = trailer.size or 0
        best_size = best_trailer.size or 0

        if size >= 1080 and best_size < 1080:
            main_trailer[trailer.language] = trailer
            continue
        if best_size >= 1080 and size < 1080:
            continue

        # Date
        if trailer.published_at and best_trailer.published_at:
            trailer_date = datetime.fromisoformat(trailer.published_at.replace("Z", "+00:00"))
            best_date = datetime.fromisoformat(best_trailer.published_at.replace("Z", "+00:00"))

            if trailer_date > best_date:
                main_trailer[trailer.language] = trailer
                continue

    # Assign is_main
    for trailer in trailers:
        trailer.is_main = (main_trailer.get(trailer.language) == trailer)

    return trailers