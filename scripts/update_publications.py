#!/usr/bin/env python3
"""Fetch the publication list from the NASA ADS library and save it as
assets/data/publications.json, which publications.html reads.

Run by .github/workflows/update-publications.yml. Needs the ADS API token in
the ADS_TOKEN environment variable (stored as a repository secret).
Uses only the Python standard library.
"""
import datetime
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

LIBRARY_ID = "IPbBWFnXRaKhhTSudbHf0Q"   # NASA ADS / SciX library that holds the papers
GROUP_AUTHOR = "iyyani"                 # always kept visible in shortened author lists
MAX_AUTHORS = 6                         # longer lists are cut to the first three + et al.
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "publications.json")


def short_name(name):
    """'Iyyani, Shabnam' -> 'Iyyani, S.'"""
    if "," not in name:
        return name.strip()
    last, first = [x.strip() for x in name.split(",", 1)]
    initials = "".join(part[0] + "." for part in re.split(r"[\s\-]+", first) if part)
    return f"{last}, {initials}" if initials else last


def short_authors(authors):
    names = [short_name(a) for a in authors]
    if len(names) <= MAX_AUTHORS:
        return names
    kept = names[:3]
    for n in names[3:]:
        if GROUP_AUTHOR in n.lower():
            kept.append(n)
    return kept + ["et al."]


def clean(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html.unescape(text or ""))).strip()


def main():
    token = os.environ.get("ADS_TOKEN", "").strip()
    if not token:
        sys.exit("ADS_TOKEN is not set. Add it under Settings > Secrets and variables > Actions.")

    query = urllib.parse.urlencode({
        "q": f"docs(library/{LIBRARY_ID})",
        "fl": "title,author,year,pub,volume,page,bibcode",
        "rows": 500,
        "sort": "date desc",
    })
    req = urllib.request.Request(
        "https://api.adsabs.harvard.edu/v1/search/query?" + query,
        headers={"Authorization": "Bearer " + token},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        docs = json.load(resp)["response"]["docs"]
    if not docs:
        sys.exit("ADS returned no papers; keeping the existing list.")

    pubs = []
    for d in docs:
        page = d.get("page") or [""]
        pubs.append({
            "t": clean((d.get("title") or [""])[0]),
            "a": short_authors(d.get("author") or []),
            "y": str(d.get("year") or ""),
            "j": clean(d.get("pub")),
            "v": str(d.get("volume") or ""),
            "p": str(page[0] if isinstance(page, list) else page),
            "b": d.get("bibcode") or "",
        })

    # Only rewrite the file when the list itself changed, so there is no daily no-op commit.
    try:
        with open(OUT, encoding="utf-8") as f:
            if json.load(f).get("publications") == pubs:
                print(f"No change ({len(pubs)} papers).")
                return
    except (OSError, ValueError):
        pass

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(), "publications": pubs},
                  f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(pubs)} papers.")


if __name__ == "__main__":
    main()
