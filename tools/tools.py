import unicodedata
import regex as re
from classes.Director import Director

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
# Compare deux liste de nom (de director par exemple)
# --------------------------------------------------------
def compare_directors(ac_list, tmdb_list):
    ac_set   = {normalize_name(n) for n in ac_list if n}
    tmdb_set = {normalize_name(n) for n in tmdb_list if n}

    if ac_set == tmdb_set:
        return 1

    if ac_set.issubset(tmdb_set) or tmdb_set.issubset(ac_set):
        return 0

    return -5 # il y'a trop de différences

# --------------------------------------------------------
# Normalise un Titre
# --------------------------------------------------------
def normalize_title(title: str) -> str:
    if not title:
        return ""
    
    cleaned = re.sub(r"[^\p{L}\p{N}\s]", "", title) # Supprimer les caractères non lettres/non chiffres
    cleaned = re.sub(r"\s+", " ", cleaned).strip().lower() # Normaliser les espaces
    return cleaned # En minuscule