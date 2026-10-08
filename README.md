# Flurnamenatlas

Webversion des [Flurnamenatlas Südtirol](https://www.flurnamen.naturmuseum.scientificnet.org/), veröffentlicht unter [flurnamen.natura.museum](https://flurnamen.natura.museum).
Das Buch ist im [Shop des Naturmuseums](https://www.natura.museum/de/forschung/monografien/#:~:text=Flurnamen%20S%C3%BCdtirols) erhältlich.

# Entwicklung

```sh
npm install
npm run dev      # Dev-Server
npm test
npm run format   # Prettier
npm run build    # nach dist/
npm run preview  # dist/ lokal ausliefern
```

# Datenupdate

```sh
npm run import-data -- FN_YYYYMMDD.csv   # Datum aus dem Dateinamen, sonst --date YYYY-MM-DD
```

Normalisiert den Datenbank-Export (Spaltenreihenfolge, Sortierung, Dezimalpunkt, Kategorie-Codes, Dubletten; Koordinaten mit < 1 m Abweichung bleiben unverändert) nach `data/flurnamen.csv` (Kategorien und Unterkategorien mit stabiler ID in `data/kategorien.csv` und `data/unterkategorien.csv`) und schreibt Exportdatum und Anzahl nach `data/meta.json`. Beim Build wird daraus `data/flurnamen.json.gz` erzeugt.

# Deployment

- `main` wird per GitHub Actions nach [naturmuseum-suedtirol.github.io/flurnamenatlas](https://naturmuseum-suedtirol.github.io/flurnamenatlas) deployt.
- `feat/xx`-Branches werden nach `naturmuseum-suedtirol.github.io/flurnamenatlas/feat/xx/` deployt und beim Löschen des Branches wieder entfernt.
- Jeder Push auf `main` erzeugt ein GitHub Release mit `flurnamenatlas-<datum>-<commit>.zip`. Für flurnamen.natura.museum das ZIP entpacken und per FTP hochladen.
