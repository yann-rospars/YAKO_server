import unicodedata

class Trailer:
    def __init__(self, id, movie_id, youtube_key, trailer_type, language, region, official, size, published_at, is_main):
        self.id = id
        self.movie_id = movie_id
        self.youtube_key = youtube_key
        self.trailer_type = trailer_type
        self.language = language
        self.region = region
        self.official = official
        self.size = size
        self.published_at = published_at
        self.is_main = is_main

    def __repr__(self):
        return (
            f"Trailer("
            f"id={self.id}, "
            f"movie_id={self.movie_id}, "
            f"youtube_key='{self.youtube_key}', "
            f"trailer_type='{self.trailer_type}', "
            f"language='{self.language}', "
            f"region='{self.region}', "
            f"official={self.official}, "
            f"size={self.size}, "
            f"published_at={self.published_at}, "
            f"is_main={self.is_main}"
            f")"
        )