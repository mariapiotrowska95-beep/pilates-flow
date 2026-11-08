# Kontekst projektu: Pilates Flow

## Osoba i cel

Właścicielka jest instruktorką pilatesu i osobą nietechniczną. Agent ma samodzielnie podejmować decyzje techniczne, wykonywać implementację i testy, opisywać wyniki prostym językiem po polsku. Nie odsyłać użytkowniczki do ręcznego programowania ani konfiguracji, jeżeli dostępne narzędzia pozwalają zrobić to samodzielnie.

Cel produktu: ułatwić dobieranie i sekwencjonowanie ćwiczeń dla konkretnych grup, dni oraz godzin, z łatwym powrotem do historii. Najważniejsza jest wygoda na telefonie.

Użytkowniczka zleciła stworzenie pełnego repozytorium, w tym GitHub. Docelowy hosting to Vercel, wdrożenie i domena na końcu. Bez kupowania usług i domen na podstawie samego ogólnego dostępu.

## Ustalenia z notatki

- Sprzęt: mata, reformer, wieża; dodatkowo słowo „wiosło”, którego znaczenie jest niepewne. Zachować osobną kategorię `rower`, nie utożsamiać automatycznie z wieżą ani wiosłowaniem przy wieży.
- Przybory: Magic Circle, mała piłka, wałek, hantle, taśma.
- Wiele niezależnych wymiarów kategoryzacji: sprzęt, cel/partia, przybory, trudność, etap zajęć.
- Opisy, wskazówki, łatwiejsze/trudniejsze warianty i powiązania przygotowujące do kolejnego ćwiczenia.
- Ćwiczenia tworzą sekwencję; rozgrzewka może odbywać się na macie także przy zajęciach na sprzęcie.
- Grupy różnią się potrzebami. Zapamiętać ogólne wskazówki do prowadzenia i użyte plany.
- Wyświetlać wykorzystanie danego ćwiczenia w zajęciach/grupach.
- Powtarzanie codziennie i co tydzień, edycja pojedynczego terminu.
- Około 200 ćwiczeń docelowo; 26 startowych to początek, nie pełna baza.
- Zapisywać na urządzeniu bez backendu. Kopie zapasowe są konieczne.
- Wzmiankę „w Excel” interpretujemy w kontekście całej notatki jako prawdopodobne przejęzyczenie od „Vercel”. Dodatkowo istnieje eksport CSV do Excela; główny produkt jest aplikacją webową.

## Stos i reguły

React + TypeScript + Vite, IndexedDB przez `idb`, Zod do walidacji, `vite-plugin-pwa`/Workbox do offline, Vitest i fake-indexeddb. Statyczny build. Bez backendu, płatnych integracji, analityki i zewnętrznych fontów.

- `src/domain` nie zależy od React ani od przeglądarkowej warstwy UI.
- Zapis wyłącznie przez `src/data/repository.ts`, transakcje i sprawdzenie rewizji. Nie dodawać drugiego magazynu prawdy w localStorage.
- Historia zawiera migawki ćwiczeń i nazwę grupy. Zmiana biblioteki lub usunięcie grupy nie może po cichu zmienić starych zajęć.
- Daty zajęć jako lokalne `YYYY-MM-DD`, godziny `HH:mm`. Nie używać `toISOString().slice(0,10)` dla dat zajęć. Testować przejścia czasu letniego/zimowego.
- Serie materializowane do wskazanej daty końcowej, limit 366 wystąpień na zapis. `seriesId` łączy terminy. Edycja dotyczy jednego terminu.
- Wszystkie własne zdjęcia w lokalnej kopii JSON; tylko PNG/JPEG/WebP, do 2 MB przy dodawaniu. Bez linkowania przypadkowych zewnętrznych zdjęć.
- Kopie mają wersję schematu. Nie ignorować błędów walidacji i nie zerować uszkodzonej bazy automatycznie.
- Import tworzy lokalny punkt przywracania w tej samej transakcji.
- Zapis ze starej karty jest odrzucany przez optimistic concurrency. Nie obchodzić tego przez bezwarunkowe nadpisanie.
- Nigdy nie obiecywać nieograniczonej trwałości danych ani automatycznej synchronizacji między urządzeniami.
- Przy zmianach schematu dodać migrację i test odtworzenia starej kopii przed publikacją.
- Nie umieszczać danych użytkowniczki, kopii JSON, zdjęć uczestników, sekretów i plików `.env` w repozytorium.

## Treści ruchowe

Instruktorka zatwierdza materiały startowe i własne programy. Nie przedstawiać katalogu jako zweryfikowanego przez fizjoterapeutę, jeśli takiej weryfikacji nie było. Nie generować planów leczenia i nie uznawać ćwiczenia za bezpieczne dla konkretnej diagnozy. Podpowiedzi aplikacji dotyczą struktury, nie klinicznej kwalifikacji. Nie ustalać uniwersalnego koloru/liczby sprężyn: zależą od modelu urządzenia i osoby.

Nowe ćwiczenia dodawane przez agenta powinny otrzymywać stabilny identyfikator, wszystkie kategorie, konkretne kroki, wskazówki, warianty oraz ostrożnie dobrane relacje przygotowawcze. Nie zmieniać istniejących identyfikatorów.

## Sprawdzanie

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm preview
```

Po zmianach w logice zapisu/serii/importu uruchomić odpowiednie testy. Po zmianach UI sprawdzić główną ścieżkę na szerokim ekranie oraz przy 390 px i 320 px, klawiaturę, puste stany, zapis po odświeżeniu. Tryb offline testować na buildzie produkcyjnym po aktywacji service workera. Nie usuwać prawdziwych danych podczas testów.

Dokumentacja: `docs/ARCHITEKTURA.md`, `docs/PRODUKT.md`, `docs/INSTRUKCJA.md`, `docs/WDROZENIE.md`, `docs/WERYFIKACJA.md`.
