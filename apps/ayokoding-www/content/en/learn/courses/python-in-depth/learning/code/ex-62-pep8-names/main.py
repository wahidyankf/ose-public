# => Example 62: the casing states each name role.
MAX_RETRIES = 3  # => WHY UPPER: a constant, set once and never reassigned


def fetch_page(url):  # => WHY snake: functions and variables read as verbs
    return f"page:{url}"  # => the stubbed fetch: naming is the lesson


class PageCache:  # => WHY CapWords: classes are the nouns of the design
    def __init__(self):  # => WHY dunder: construction protocol, never renamed
        self._pages = {}  # => WHY underscore: private by convention

    def get(self, url):  # => public method: the curated surface
        if url not in self._pages:  # => WHY cache: fetch once per url
            self._pages[url] = fetch_page(url)  # => stored under the plain key
        return self._pages[url]  # => cached or fresh, same contract


cache = PageCache()  # => WHY instance: lowercase, it is a variable
print(cache.get("a"))  # => Output: page:a, first fetch stored
print(cache.get("a"))  # => Output: page:a, second served from cache
print(MAX_RETRIES)  # => Output: 3, constant read plainly
