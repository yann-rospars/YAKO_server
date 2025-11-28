class Director:
    def __init__(self, id, id_ac=None, id_tmdb=None, name=None, profile_path=None):
        self.id = id
        self.id_ac = id_ac            # ID Allociné
        self.id_tmdb = id_tmdb        # ID TMDB
        self.name = name              # nom brut
        self.profile_path = profile_path

    def __repr__(self):
        return (
            f"ID(name='{self.id}', "
            f"id_ac={self.id_ac}, "
            f"id_tmdb={self.id_tmdb}, "
            f"Name(name='{self.name}', "
            f"profile_path='{self.profile_path}')"
        )