# SongMoment – von null auf hundert

Diese Version ist bewusst neu aufgebaut und nicht auf den vorherigen lokalen HTML-Demos aufgebaut.

## Funktionen

### Gastseite
- Event-Code
- Name ohne Konto
- echte YouTube-Suche
- Suchergebnisse mit Thumbnail
- offizieller YouTube-Player direkt auf der Seite
- Song vor Auswahl prüfen
- Song hinzufügen
- globale Duplikat-Sperre pro Event
- Songlimit pro Gast
- gemeinsame Songliste
- mobil optimiert

### Creator
- Dashboard
- Events erstellen
- Event-Code + Direktlink
- Gästeübersicht
- Songübersicht
- Songs löschen
- Event öffnen/schließen
- CSV-Export
- keine Creator-Passwortabfrage in dieser privaten ersten Version

## Voraussetzung

Für die echte Musiksuche brauchst du einen YouTube Data API v3 Key.

Die YouTube Data API `search.list` kann Videos nach Suchbegriffen durchsuchen. Die Anwendung filtert auf Musikvideos, einbettbare und außerhalb von YouTube abspielbare Ergebnisse. Der offizielle YouTube IFrame Player wird zum Abspielen eingebettet.

## Installation

1. Node.js LTS installieren.
2. ZIP entpacken.
3. Terminal/PowerShell in den Projektordner öffnen.
4. `.env.example` in `.env` kopieren.
5. Deinen YouTube API Key bei `YOUTUBE_API_KEY=` eintragen.
6. `npm install`
7. `npm start`
8. Browser öffnen: `http://127.0.0.1:3000`

## YouTube API

In Google Cloud:
- Projekt erstellen
- YouTube Data API v3 aktivieren
- API-Key erstellen
- Key in `.env` eintragen

Der Key bleibt serverseitig und wird nicht an Gäste ausgeliefert.

## Wichtige technische Grenze

YouTube ist die Musik-/Videoquelle. Die Webseite kann nicht garantieren, dass jedes existierende Lied einbettbar ist; einzelne Videos können vom Rechteinhaber für externe Wiedergabe gesperrt oder regional nicht verfügbar sein.

Die YouTube Data API hat ein API-Kontingent. Suchanfragen laufen über `search.list`; die aktuellen Google-Dokumente beschreiben ein separates Such-Kontingent. Für größere öffentliche Nutzung muss das Kontingent geprüft bzw. ggf. erweitert werden.

## Spotify

Spotify ist in dieser Version komplett entfernt. Es gibt keine Spotify Developer App, keinen Spotify Client und keine Spotify-Anmeldung.

## Öffentliches Hosting

Für einen echten Partybetrieb:
- Node.js Hosting
- dauerhafte SQLite-Datei oder besser PostgreSQL
- HTTPS
- eigener Domainname
- `.env` serverseitig

Die lokale Version ist der komplette funktionierende Ausgangspunkt für diesen Betrieb.
