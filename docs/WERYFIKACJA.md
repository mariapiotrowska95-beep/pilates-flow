# Weryfikacja pierwszej wersji

Data: 8 listopada 2026. Sprawdzono lokalny build produkcyjny w przeglądarce aplikacji Codex. Testy wykonywano wyłącznie na sztucznych danych oznaczonych `TEST`; podgląd przywrócono potem do pustego kalendarza i grup.

## Automatycznie

`pnpm check`: **15 testów zaliczonych** i poprawna kontrola TypeScript.

- Daty lokalne i serie przez zmianę czasu wiosną oraz jesienią i na przełomie roku.
- Walidacja nieprawidłowych dat, granic i maksymalnej długości serii.
- Osobne identyfikatory, migawki opisów, niezależność terminów oraz edycja jednego wystąpienia.
- Odrzucenie pustego planu i próby edycji usuniętego terminu.
- Spójność katalogu i relacji przygotowawczych, czas i podpowiedzi strukturalne.
- Eksport/import schematu, odrzucenie nieobsługiwanej wersji, duplikatów ID i aktywnego formatu obrazu.
- Sugerowanie kategorii na podstawie polskich nazw i opisów, również „bioder”.
- Odczyt IndexedDB po ponownym otwarciu, konflikt rewizji i atomowa kopia sprzed importu.

`pnpm build`: **poprawny build produkcyjny**, statyczny katalog `dist`, manifest oraz service worker. Workbox objął cache 15 zasobów (około 473 KiB). Dwa ostrzeżenia Rollup dotyczą komentarzy optymalizacyjnych wewnątrz Zod; komentarze zostały usunięte przez bundler, bez błędu budowania.

## W przeglądarce

| Ścieżka | Wynik i dowód |
|---|---|
| Utworzenie grupy | Zapisana nazwa i wskazówki pojawiły się w karcie i wyborze grupy planera |
| Wyszukiwanie | „biodrowy” zwróciło most biodrowy |
| Planowanie | Dodawanie trzech ruchów, zmiana kolejności strzałką i przejście do planu |
| Szablony | Startowy plan maty dodał 9 ruchów, łącznie 32 min |
| Daty i seria | Zapis formularza utworzył dokładnie 10, 17 i 24 listopada 2026; potwierdzone w historii i pobranej kopii JSON |
| Prowadzenie | Rozwinięte opisy, wskazówki i warianty; zmiana statusu na „Odbyte” |
| Własne zdjęcie | Utworzone ćwiczenie z testowym PNG; obraz widoczny na karcie i obecny jako dane obrazu w kopii |
| Kopia i import | Rzeczywisty plik pobrany, sparsowany i przywrócony przez wybór pliku; punkt odzyskiwania widoczny po przeładowaniu |
| Trwałość | Grupa, szkic i zapisane zajęcia przetrwały przeładowanie |
| 390 px | Biblioteka bez poziomego przepełnienia, widoczna dolna nawigacja i karty; zrzut w `docs/screenshots/biblioteka-telefon.png` |
| 320 px | Szerokość dokumentu równa 320 px w bibliotece oraz planerze, bez przewijania na boki |
| Konsola | Brak błędów konsoli przy końcowym sprawdzeniu |
| Offline | Po aktywacji najnowszego service workera zatrzymano serwer podglądu; żądanie HTTP zwróciło brak połączenia. Przeładowanie aplikacji nadal otworzyło bibliotekę 26 ruchów, a wyszukiwanie „biodrowy” działało |

## Poprawki wynikające z testów

- Powiadomienie nie przechwytuje kliknięć paska wyboru planu.
- Formularz reaguje natychmiast na pisanie, a potwierdzenie sukcesu czeka na zatwierdzenie transakcji.
- Pola daty i czasu obsługują również zdarzenie `input`; zmiany nie znikają po edycji innego pola.
- Nawigacja boczna poza ekranem telefonu jest ukryta także dla interakcji.
- Powiększone mobilne przyciski dodawania i zmiany kolejności.

## Pozostałe granice sprawdzenia

Nie sprawdzano instalacji na fizycznym iPhonie lub Androidzie ani wieloletniej retencji danych. Test lokalnego cache nie zastępuje próby offline na docelowym telefonie po wdrożeniu HTTPS. Nie przeprowadzono audytu dostępności WCAG, testów klinicznych katalogu ani obciążenia wieloletnią historią i setkami dużych zdjęć. Wdrożenie Vercel i jego nagłówki wymagają sprawdzenia po publikacji.

Kod nie integruje się z wcześniejszym projektem `pilates-planner` i nie współdzieli jego danych ani historii Git.
