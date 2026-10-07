# reizarm

Ein Verzeichnis für Cafés, Restaurants und andere Orte, die bewusst wenig
sensorische Reize gleichzeitig auf Besucher:innen wirken lassen –
gemacht für neurodivergente Menschen (Autismus, ADHS, Hochsensibilität, ...),
aber nützlich für alle, die Reizüberflutung vermeiden wollen.

Offen für ganz Europa – jede Stadt und jedes Land kann eingetragen werden,
es gibt keine Städte-Beschränkung im Code. Die Karte zeigt standardmäßig
Europa im Überblick und zoomt automatisch auf die aktuell sichtbaren Orte.

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

Optional kommt eine unabhängige **Sterne-Bewertung** (`quality`, 1-5) für
Essen/Service dazu. Bewusst getrennt von den Reiz-Kriterien: ein ruhiger,
reizarmer Ort mit schlechtem Essen oder schlechtem Service hilft ja auch
nicht weiter, und umgekehrt sagt "5 Sterne toll" nichts über Reizarmut aus.

## Struktur

- `index.html` – Seite mit Karte + Filterbare Liste
- `style.css` – Styling
- `app.js` – Lädt `data/places.json`, rendert Karte (Leaflet/OpenStreetMap) und Liste, Filterlogik
- `data/places.json` – Die eigentlichen Ortsdaten

## Ort vorschlagen (für Besucher:innen, ohne GitHub-Account)

Der "Ort vorschlagen"-Button auf der Seite führt zu einem öffentlichen
Airtable-Formular. Jede:r kann dort ohne Account eine eigene Erfahrung
eintragen – Bewertung pro Kriterium, Adresse, Tipps.

**Einreichung und Sichtbarkeit sind entkoppelt:** Neue Einträge erscheinen
sofort auf der Karte (als "Community-Eintrag · ungeprüft" gekennzeichnet),
ohne dass jemand sie vorher freigeben muss. Die Website liest die
Airtable-Tabelle `Orte` live über einen Nur-Lese-API-Token mit. Moderation
passiert danach: Ein:e Kurator:in sichtet neue Einträge in Airtable in
Ruhe und kann Unsinn/Spam per Status `Abgelehnt` (verschwindet sofort von
der Website) oder durch Löschen der Zeile entfernen. Besonders vertrauens­
würdige Einträge können optional zusätzlich in `data/places.json`
übernommen werden (dann ohne "ungeprüft"-Badge) – das ist aber keine
Voraussetzung fürs Erscheinen.

Fehlende Koordinaten (Einreichende geben nur eine Adresse an) werden
client-seitig automatisch per OpenStreetMap-Nominatim geokodiert.

### Setup (einmalig, in der Airtable-Oberfläche)

Die Base samt Tabelle und allen Feldern ist bereits angelegt. Zwei Dinge
lassen sich nicht über die verfügbare API erledigen, weil beides bewusst
manuelle Sicherheits-/Freigabeschritte von Airtable sind – das Erstellen
eines öffentlichen Formulars und das Ausstellen eines API-Tokens:

1. **Formular:** Tabelle `Orte` öffnen → "+" neben den View-Reitern →
   **Form**. Feld `Status` im Formular-Editor ausblenden. Oben rechts
   **"Share form"** → Link kopieren → in `app.js` bei
   `SUBMISSION_FORM_URL` eintragen (oder mir geben).
2. **Nur-Lese-Token:** Profilsymbol oben rechts → **Developer hub** →
   "Personal access tokens" → **Create token**. Scope: nur
   `data.records:read`. Access: nur die Base "reizarm Einreichungen"
   auswählen (keine anderen Bases!). Token erstellen, Wert kopieren (nur
   einmal sichtbar) → in `app.js` bei `AIRTABLE_READ_TOKEN` eintragen
   (oder mir geben).

**Sicherheitshinweis:** Der Token landet im öffentlich sichtbaren
Frontend-Code. Er darf deshalb **ausschließlich** Lesezugriff auf genau
diese eine Base haben – niemals einen Token mit Schreib- oder
Vollzugriff hier eintragen.

**Neues Feld im bestehenden Formular sichtbar machen:** Das Feld
"Qualität (Essen/Service)" wurde nachträglich zur Tabelle hinzugefügt.
Airtable nimmt neue Felder nicht automatisch in ein bereits erstelltes
Formular auf – bitte einmal im Formular-Editor prüfen und das Feld bei
Bedarf manuell einblenden.

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
  "quality": 4,
  "tips": "Kurzer, konkreter Hinweis.",
  "lastVerified": "2026-07-29"
}
```

`quality` ist optional (1-5, Sterne) und kann weggelassen werden, wenn
keine Einschätzung zu Essen/Service vorliegt.

**Wichtig:** Bewertungen sollten auf tatsächlichem Vor-Ort-Erleben beruhen,
nicht auf Vermutung. `lastVerified` hilft, veraltete Einträge zu erkennen.

Die zwei Beispiel-Einträge in `data/places.json` sind frei erfunden
(Kennzeichnung "(Beispiel)") und dienen nur als Platzhalter für das Schema –
bitte durch echte, geprüfte Orte ersetzen bzw. ergänzen.

## Roadmap

- [x] MVP: statische Seite, Karte, Filter, Stuttgart-Startdaten (Platzhalter)
- [x] Airtable-Base für öffentliche Einreichungen ohne Account
- [x] Live-Einbindung: Einreichung und Sichtbarkeit entkoppelt, Adress-Geokodierung
- [x] Form-View in Airtable eingerichtet, Link in `app.js` eingetragen
- [x] Europaweit geöffnet: keine Städte-/Länder-Beschränkung mehr, Karte zeigt
      standardmäßig Europa und zoomt automatisch auf vorhandene Orte
- [ ] Nur-Lese-Token erstellen und in `app.js` eintragen
- [ ] Echte Orte recherchieren und eintragen (beliebige Stadt/Land)
- [ ] Mobile-Optimierung / PWA
