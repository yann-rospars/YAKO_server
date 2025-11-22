class Director:
    def __init__(self, name, id_ac=None, id_tmdb=None, profile_path=None):
        self.name = name              # nom brut
        self.id_ac = id_ac            # ID Allociné
        self.id_tmdb = id_tmdb        # ID TMDB
        self.profile_path = profile_path

    def __repr__(self):
        return (
            f"Director(name='{self.name}', "
            f"id_ac={self.id_ac}, "
            f"id_tmdb={self.id_tmdb}, "
            f"profile_path='{self.profile_path}')"
        )