# reizarm

Ein Verzeichnis für Cafés, Restaurants und andere Orte, die bewusst wenig
sensorische Reize gleichzeitig auf Besucher:innen wirken lassen –
gemacht für neurodivergente Menschen (Autismus, ADHS, Hochsensibilität, ...),
aber nützlich für alle, die Reizüberflutung vermeiden wollen.

Start: Stuttgart. Ziel: ganz Europa.

## Konzept

Jeder Ort wird nach denselben Kriterien bewertet (Skala 1 = reizarm,
3 = reizintensiv). So lässt sich nach persönlicher Toleranz filtern statt
nach vagen "gemütlich"-Beschreibungen.

| Kriterium | Was wird bewertet |
|---|---|
| `light` (Licht) | Gedimmtes/natürliches Licht vs. grelle Neonbeleuchtung, Flackern |
| `noise` (Geräuschkulisse) | Allgemeiner Lärmpegel, Nebengeräusche (Kaffeemaschine, Klimaanlage, Küche) |
| `music` (Musik) | Keine/leise/instrumentale Musik vs. laute, wechselnde Playlist |
| `smell` (Düfte/Gerüche) | Starke Parfums, Reinigungsmittel, offene Küche mit intensiven Gerüchen |
| `menu` (Speisekarte) | Übersichtliche, kleine Karte vs. riesige, unübersichtliche Auswahl |
| `space` (Räumliche Faktoren) | Enge vs. Weite, Sitzabstände, Rückzugsecken, klare Wegeführung, sichtbare Ausgänge |
| `social` (Soziale Reize) | Erwarteter Small-Talk, Selbstbestellung vs. Bedienung am Tisch, Warteschlangen-Stress |
| `sensory` (Sensorik allgemein) | Temperatur/Klimatisierung, Oberflächen/Haptik, visuelle Reize (Deko, Bildschirme, Blinklichter) |

Jeder Eintrag hat außerdem freien Text (`tips`) für konkrete Hinweise,
z. B. "ruhiger Tisch hinten links" oder "Kopfhörer werden nicht schräg angeschaut".

## Struktur

- `index.html` – Seite mit Karte + Filterbare Liste
- `style.css` – Styling
- `app.js` – Lädt `data/places.json`, rendert Karte (Leaflet/OpenStreetMap) und Liste, Filterlogik
- `data/places.json` – Die eigentlichen Ortsdaten

## Ort vorschlagen (für Besucher:innen, ohne GitHub-Account)

Der "Ort vorschlagen"-Button auf der Seite führt zu einem öffentlichen
Airtable-Formular. Jede:r kann dort ohne Account eine eigene Erfahrung
eintragen – Bewertung pro Kriterium, Adresse, Tipps.

Einreichungen landen zunächst in der Airtable-Base **"reizarm
Einreichungen"** (Tabelle `Orte`, Status `Neu`) und erscheinen **nicht**
automatisch auf der Karte. Ein:e Kurator:in prüft neue Einträge, setzt den
Status auf `Geprüft`/`Abgelehnt` und übernimmt geprüfte Orte manuell nach
dem Schema unten in `data/places.json` (Status dann `Übernommen`). Das ist
bewusst kein Vollautomatismus, damit keine ungeprüften/falschen
Reiz-Bewertungen live gehen.

### Setup des Formulars (einmalig, in der Airtable-Oberfläche)

Die Base samt Tabelle und allen Feldern ist bereits angelegt – nur der
öffentliche Form-View fehlt noch, weil das Erstellen von Formularen über
die verfügbare API nicht möglich ist:

1. Base "reizarm Einreichungen" → Tabelle `Orte` öffnen.
2. Über dem Grid auf **"+"** neben den View-Reitern klicken → **Form** wählen.
3. Das Feld `Status` im Formular-Editor ausblenden (nicht für Einreichende
   gedacht, bleibt leer = entspricht `Neu`).
4. Oben rechts **"Share form"** → Link kopieren.
5. Den Link in `app.js` bei `SUBMISSION_FORM_URL` eintragen (oder mir
   geben, dann trage ich ihn ein) – der Button erscheint dann automatisch
   auf der Seite (er ist ausgeblendet, solange die URL leer ist).

### Direkter Weg für technische Beitragende

Wer mit Git/GitHub vertraut ist, kann Orte weiterhin direkt per Pull
Request eintragen – siehe Schema unten.

`data/places.json` ist ein Array von Objekten nach diesem Schema:

```json
{
  "id": "eindeutige-id",
  "name": "Name des Orts",
  "category": "Café | Restaurant | Bar | Bäckerei | Coworking | ...",
  "city": "Stuttgart",
  "country": "Deutschland",
  "address": "Straße 1, 70173 Stuttgart",
  "lat": 48.7758,
  "lng": 9.1829,
  "website": "https://...",
  "criteria": {
    "light": 1,
    "noise": 1,
    "music": 1,
    "smell": 2,
    "menu": 1,
    "space": 2,
    "social": 1,
    "sensory": 1
  },
  "tips": "Kurzer, konkreter Hinweis.",
  "lastVerified": "2026-07-29"
}
```

**Wichtig:** Bewertungen sollten auf tatsächlichem Vor-Ort-Erleben beruhen,
nicht auf Vermutung. `lastVerified` hilft, veraltete Einträge zu erkennen.

Die zwei Beispiel-Einträge in `data/places.json` sind frei erfunden
(Kennzeichnung "(Beispiel)") und dienen nur als Platzhalter für das Schema –
bitte durch echte, geprüfte Orte ersetzen bzw. ergänzen.

## Roadmap

- [x] MVP: statische Seite, Karte, Filter, Stuttgart-Startdaten (Platzhalter)
- [x] Airtable-Base für öffentliche Einreichungen ohne Account
- [ ] Form-View in Airtable einrichten und Link in `app.js` eintragen
- [ ] Echte Stuttgart-Orte recherchieren und eintragen
- [ ] Ausweitung auf weitere deutsche/europäische Städte
- [ ] Mobile-Optimierung / PWA
