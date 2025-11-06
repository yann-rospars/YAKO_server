import unicodedata


def normalize_name(name: str) -> str:
    if not name:
        return ""

    # Supprime les accents (é → e, ç → c, ă → a, etc.)
    name = unicodedata.normalize('NFD', name)
    name = name.encode('ascii', 'ignore').decode('utf-8')

    # Met en minuscules et supprime les espaces superflus
    name = name.lower().strip()

    return name