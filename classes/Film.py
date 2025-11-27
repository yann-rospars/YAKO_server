import unicodedata

class Film:
    def __init__(self, id, allocine_id, tmdb_id, title, original_title, is_adult, original_language, overview, popularity, poster_path, release_date, revenue, budget, runtime, vote_average, vote_count, spoken_languages):
        self.id = id
        self.allocine_id = allocine_id
        self.tmdb_id = tmdb_id
        self.title = title
        self.original_title = original_title
        self.is_adult = is_adult
        self.original_language = original_language
        self.overview = overview
        self.popularity = popularity
        self.poster_path = poster_path
        self.release_date = release_date
        self.revenue = revenue
        self.budget = budget
        self.runtime = runtime
        self.vote_average = vote_average
        self.vote_count = vote_count
        self.spoken_languages = spoken_languages

    def __repr__(self):
        return (
            "Film("
            f"id={self.id}, "
            f"title='{self.title}', "
            f"original_title='{self.original_title}', "
            f"release_date={self.release_date}, "
            f"runtime={self.runtime}, "
            f"allocine_id={self.allocine_id}, "
            f"tmdb_id={self.tmdb_id}, "
            f"poster_path='{self.poster_path}'"
            ")"
        )
    
    @classmethod
    def from_tmdb_no_details(cls, tmdb_data):
        """Crée un Film avec un minimum d'informations depuis la source TMDB sans détails."""

        return cls(
            id=None,
            allocine_id=None,
            tmdb_id=tmdb_data.get("id"),
            title=tmdb_data.get("title"),
            original_title=tmdb_data.get("original_title"),
            is_adult=None,
            original_language=tmdb_data.get("original_language"),
            overview=tmdb_data.get("overview"),
            popularity=tmdb_data.get("popularity"),
            poster_path=tmdb_data.get("poster_path"),
            release_date=tmdb_data.get("release_date"),
            revenue=None,
            budget=None,
            runtime=None,
            vote_average=tmdb_data.get("vote_average"),
            vote_count=tmdb_data.get("vote_count"),
            spoken_languages=None
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


        # --- Extraction du poster ---
        poster_path = None
        poster_data = allocine_data.get("poster")

        if isinstance(poster_data, dict):
            poster_path = poster_data.get("path")
    
        return cls(
            id=None,
            allocine_id=allocine_data.get("internalId"),
            tmdb_id=None,  # Allociné n'a pas de TMDB ID

            title=allocine_data.get("title", "Titre non disponible"),
            original_title=allocine_data.get("originalTitle", "Titre original non disponible"),
            is_adult=None,  
            original_language=None,
            overview=synopsis,
            release_date=release_date,

            revenue=None,
            budget=None,
            runtime=runtime,

            vote_average=None,
            vote_count=None,
            spoken_languages=None,

            popularity=None,
            poster_path=poster_path
        )
