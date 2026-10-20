DraveTable (PWA) - op de telefoon zetten
========================================

DraveTable is een installeerbare web-app (PWA): initiatief- en HP-tracker voor
D&D. Werkt offline op de telefoon, met een eigen app-icoon (de draak).

Op dravenlock.nl zetten
-----------------------
1. Upload de HELE map "dravetable" (met index.html, manifest.webmanifest,
   sw.js en de map icons) naar je website, bijvoorbeeld naar:
       https://dravenlock.nl/dravetable/
   (Belangrijk: de bestanden moeten via https:// geopend worden; dat heb je al.)
2. Open op de telefoon https://dravenlock.nl/dravetable/ in de browser.

Installeren op de telefoon
--------------------------
- Android (Chrome): tik op het menu (drie puntjes) -> "App installeren" of
  "Toevoegen aan startscherm".
- iPhone (Safari): tik op het deel-icoon -> "Zet op beginscherm".
Daarna staat DraveTable als app-icoon op het scherm en werkt het offline.

Bijwerken
---------
Komt er een nieuwe versie? Vervang de bestanden op de site en verhoog in sw.js
de regel CACHE = "dravetable-v1" naar -v2 (enz.); dan haalt de telefoon de
nieuwe versie op.

Alles wordt lokaal op de telefoon bewaard (het lopende gevecht en de taal).

Vragen / donatie: service@dravenlock.nl - paypal.me/roger076
