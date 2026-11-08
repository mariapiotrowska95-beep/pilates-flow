# Pilates Flow

Osobisty planer zajęć pilates, zaprojektowany przede wszystkim na telefon. Biblioteka ćwiczeń, sekwencje, grupy, kalendarz i historia w jednej aplikacji. Interfejs i dokumentacja są po polsku.

**Status:** działająca pierwsza wersja lokalna. Przygotowana do wdrożenia na Vercel; publikacja i domena są osobnym, końcowym etapem. Zobacz [architekturę](docs/ARCHITEKTURA.md), [zakres produktu](docs/PRODUKT.md) i [instrukcję obsługi](docs/INSTRUKCJA.md).

## Uruchomienie

Wymagane: Node.js 24 LTS i pnpm w wersji wskazanej w `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Adres wyświetlony w terminalu, domyślnie `http://127.0.0.1:5173`.

```sh
pnpm check           # TypeScript i testy logiki/danych
pnpm build           # statyczna wersja produkcyjna w dist/
pnpm preview         # lokalny podgląd produkcji, domyślnie port 4173
```

Jeżeli komputer nie ma Node.js, agent może użyć środowiska dostarczonego przez aplikację Codex. Ścieżki tego środowiska są zależne od komputera i nie są wymaganiem projektu.

## Co działa

- 26 ćwiczeń startowych: mata, reformer i wieża. Osobna kategoria wiosła gotowa na własne opisy.
- Wyszukiwanie, ulubione i filtry: sprzęt, cele ruchowe, poziom, przybory.
- Pełne opisy, etapy, wskazówki i warianty; tworzenie i edycja własnych ćwiczeń ze zdjęciem do 2 MB.
- Lokalne sugerowanie kategorii na podstawie nazwy i opisu; ręczna korekta.
- Szkic planu zapisujący się na urządzeniu, zmiana kolejności strzałkami, czas i notatki do każdego ruchu.
- Rozgrzewka, część główna, wyciszenie i podpowiedzi do sprawdzenia struktury.
- Grupy i ich wskazówki; data, godzina, serie codzienne i tygodniowe z datą końcową.
- Kalendarz tygodnia, historia, statusy, edycja pojedynczego terminu, kopiowanie planów.
- Lista zajęć wykorzystujących ćwiczenie, tryb prowadzenia i druk.
- Własne szablony oraz dwa startowe szablony do dopasowania przez instruktorkę.
- IndexedDB, pełny eksport/import JSON z walidacją i kopią stanu sprzed importu.
- Eksport tabeli zajęć CSV do Excela.
- PWA i cache zasobów: wersja produkcyjna działa offline po pierwszym pełnym otwarciu.

Kalendarz i grupy zaczynają puste. Przykładowe szablony i opisy nie udają historii prawdziwych zajęć.

## Dane i ograniczenia

Nie ma kont, backendu ani zewnętrznej bazy. Dane użytkowniczki nie są wysyłane na serwer; strona pobiera jedynie własne pliki aplikacji. Nie ma automatycznej synchronizacji telefonu z komputerem. Przenoszenie danych odbywa się przez JSON.

**Zapis w przeglądarce nie jest gwarancją przechowania przez rok lub pięć lat.** Regularnie pobieraj kopię. Wyczyszczenie danych witryny, zmiana domeny/profilu przeglądarki albo utrata urządzenia wymagają odtworzenia z kopii. Przycisk trwałej pamięci prosi przeglądarkę o ograniczenie automatycznego usuwania danych.

Opisy startowe są materiałem redakcyjnym do oceny instruktorki. Aplikacja nie diagnozuje, nie kwalifikuje do ćwiczeń i nie generuje programów rehabilitacji. Dekoracyjne ilustracje nie pokazują techniki ruchu. Nie przypisujemy ćwiczeń do konkretnego schorzenia na podstawie samych tagów.

## Struktura

```text
src/
  domain/           # model, walidacja, daty, serie, migawki, podpowiedzi
  data/             # katalog i adapter IndexedDB, kolejka zapisu
  components/       # biblioteka, planer, kalendarz, grupy, ustawienia
  test/             # środowisko testowe IndexedDB
  App.tsx           # nawigacja i kompozycja przypadków użycia
public/             # lokalne ikony PWA
docs/               # decyzje i instrukcje
AGENTS.md           # kontekst i reguły dalszego rozwoju
vercel.json         # konfiguracja statycznego wdrożenia
.github/workflows/  # automatyczne sprawdzenie i build
```

## Wdrożenie na Vercel

Gotowa konfiguracja znajduje się w `vercel.json`. Nie wymaga zmiennych środowiskowych ani usług zewnętrznych. Instrukcja w [docs/WDROZENIE.md](docs/WDROZENIE.md). Koszt i dostępność planów należy sprawdzić przy faktycznej publikacji.

## Dalszy rozwój

Najpierw zweryfikować katalog z instruktorką, uzupełniać własne ćwiczenia i sprawdzić używanie podczas realnych zajęć. Następnie: zarządzanie usuwaniem szablonów, usprawnienie dużych bibliotek zdjęć, ewentualna synchronizacja oraz opakowanie mobilne Capacitor. Docelowy model danych i osobny adapter pamięci ułatwiają te zmiany bez przebudowy całego interfejsu.
