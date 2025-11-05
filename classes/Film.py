import unicodedata

class Film:
    def __init__(self, id, title, original_title, director, overview=None, release_date=None, runtime=None, poster_path=None):
        self.id = id
        self.title = title
        self.original_title = original_title
        self.director = director
        self.overview = overview
        self.release_date = release_date
        self.runtime = runtime
        self.poster_path = poster_path

    def __repr__(self):
        return (
            f"Film(id={self.id}, title='{self.title}', original_title='{self.original_title}', Director='{self.director}', "
            f"release_date={self.release_date}, runtime={self.runtime}, poster_path={self.poster_path})"
        )

    # --- Constructeur alternatif : depuis TMDB ---
    @classmethod
    def from_tmdb(cls, tmdb_data):
        """Crée un Film à partir d'un objet TMDB (clé ou format spécifique)."""
        return cls(
            id = tmdb_data.get("id"),
            title=tmdb_data.get("title"),
            original_title=tmdb_data.get("original_title"),
            director=None,
            overview=tmdb_data.get("overview"),
            release_date=tmdb_data.get("release_date"),
            runtime=None,
            poster_path=None
        )

    # --- Constructeur alternatif : depuis Allociné ---
    @classmethod
    def from_allocine(cls, allocine_data):
        import html
        
        # --- Extraction du synopsis ---
        synopsis = None
        synopsis_json = allocine_data.get("synopsis_json")
        if synopsis_json:
            body = synopsis_json.get("body")
            if body and isinstance(body, list) and len(body) > 0:
                first_paragraph = body[0]
                children = first_paragraph.get("children")
                if children and isinstance(children, list) and len(children) > 0:
                    text = children[0].get("text")
                    if text:
                        synopsis = html.unescape(text.strip())  # nettoie et décode

        if not synopsis:
            raw_synopsis = allocine_data.get("synopsis")
            if raw_synopsis:
                synopsis = html.unescape(raw_synopsis.strip())

        # --- Extraction de la date de sortie ---
        release_date = None
        releases = allocine_data.get("releases", [])

        if isinstance(releases, list) and len(releases) > 0:
            released_dates = []

            for release in releases:
                if not isinstance(release, dict):
                    continue

                name = release.get("name", "")
                date_info = release.get("releaseDate")

                if isinstance(date_info, dict):
                    date_value = date_info.get("date")

                    # Si c’est bien une sortie "Released"
                    if date_value and name.lower() == "released":
                        released_dates.append(date_value)

            # on prend la plus ancienne
            if released_dates:
                release_date = min(released_dates)

        # --- Extraction du runtime ---
        runtime_str = allocine_data.get("runtime")
        runtime = None
        if runtime_str:
            runtime_str = runtime_str.replace(" ", "")
            if "h" in runtime_str.lower():
                runtimeSplit = runtime_str.split("h")
                hours = int(runtimeSplit[0])
                minutes = 0
                if len(runtimeSplit) > 1 and runtimeSplit[1] != "":
                    runtimeSplit[1] = runtimeSplit[1].replace("min", "")
                    minutes = int(runtimeSplit[1])
            else:
                runtimeSplit = runtime_str.split("min")
                hours = 0
                minutes = int(runtimeSplit[0])
            runtime = hours * 60 + minutes
        
        # --- Extraction du director ---
        director = None
        credits = allocine_data.get("credits")
        if isinstance(credits, list):
            for credit in credits:
                position = credit.get("position", {})
                if position.get("name") == "DIRECTOR":
                    person = credit.get("person", {})
                    first_name = person.get("firstName", "").strip()
                    last_name = person.get("lastName", "").strip()

                    # Combine les deux noms
                    full_name = f"{first_name} {last_name}".strip()

                    # Supprime uniquement les accents
                    full_name = unicodedata.normalize('NFD', full_name)
                    full_name = full_name.encode('ascii', 'ignore').decode('utf-8')

                    # Met en minuscules et nettoie les espaces superflus
                    director = full_name.lower().strip()                    
                    break

        # --- Extraction du poster ---
        poster_path = None
        poster_data = allocine_data.get("poster")

        if isinstance(poster_data, dict):
            poster_path = poster_data.get("path")


        return cls(
            id = allocine_data.get("internalId"),
            title = allocine_data.get("title", "Titre non disponible"),
            original_title = allocine_data.get("originalTitle", "Titre original non disponible"),
            director = director,
            overview = synopsis,
            release_date = release_date,
            runtime = runtime,
            poster_path = poster_path
        )

    # --- Getters et Setters (optionnels, ici surtout pour clarté) ---
    def get_id(self):
        return self.id

    def set_id(self, new_id):
        self.id = new_id

    def get_title(self):
        return self.title

    def set_title(self, new_title):
        self.title = new_title

    def get_original_title(self):
        return self.original_title

    def set_original_title(self, new_original_title):
        self.original_title = new_original_title

    def get_director(self):
        return self.director

    def set_director(self, director):
        self.director = director

    def get_overview(self):
        return self.overview

    def set_overview(self, new_overview):
        self.overview = new_overview

    def get_release_date(self):
        return self.release_date

    def set_release_date(self, new_date):
        self.release_date = new_date

    def get_runtime(self):
        return self.runtime

    def set_runtime(self, new_runtime):
        self.runtime = new_runtime

    def get_runtime(self):
        return self.poster_path

    def set_runtime(self, new_poster_path):
        self.runtime = new_poster_path
