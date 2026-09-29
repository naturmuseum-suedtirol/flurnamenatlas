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

# Deployment

- `main` wird per GitHub Actions nach [naturmuseum-suedtirol.github.io/flurnamenatlas](https://naturmuseum-suedtirol.github.io/flurnamenatlas) deployt.
- Jeder Push auf `main` erzeugt ein GitHub Release mit `flurnamenatlas-<datum>-<commit>.zip`. Für flurnamen.natura.museum das ZIP entpacken und per FTP hochladen.
