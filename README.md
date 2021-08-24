# Flurnamenatlas

Webversion des [Flurnamenatlas Südtirol](https://www.flurnamen.naturmuseum.scientificnet.org/), entstanden aus Jux nach einem [Twitter-Rant](https://twitter.com/bmgnrs/status/1422975066090971138). Mittlerweile wurde sie unter [flurnamen.natura.museum](https://flurnamen.natura.museum) veröffentlicht.

## Hinweis
Die Daten für diese Webversion wurden aus der ursprünglichen Windows-Applikation exportiert, dabei sind einige Exportfehler aufgetreten. Daher sind die veröffentlichten Daten noch nicht zu 100% sauber und vollständig. Ein neuer Export ist bereits geplant.

## Entwicklung
Um CORS-Fehler zu vermeiden, müssen die Daten über einen Webserver ausgeliefert werden, zum Beispiel:

* Python2: `python2 -m SimpleHTTPServer`
* Python3: `python3 -m http.server`

Der `main`-Branch dieses Repositorys wird unter [abaumg.github.io/flurnamenatlas](https://abaumg.github.io/flurnamenatlas) veröffentlicht.