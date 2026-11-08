# Wdrożenie na Vercel

Wdrożenie jest przewidziane jako końcowy etap. Pliki projektu są gotowe do statycznego hostingu. Nie ma serwera aplikacji ani wymaganych sekretów.

## Konfiguracja

| Pole | Wartość |
|---|---|
| Framework preset | Vite |
| Node.js | 24 LTS |
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm build` |
| Output | `dist` |
| Root Directory | katalog główny repozytorium |
| Zmienne środowiskowe | brak |

`vercel.json` utrzymuje ustawienia i nagłówki. Statyczny JSON pozostaje wystarczający dla tego małego projektu; nie potrzebujemy dynamicznego generatora konfiguracji. Nawigacja używa fragmentów URL (`#library` itd.), dlatego nie wymaga reguł przepisywania ścieżek.

## Przebieg

1. Przed wdrożeniem wykonać `pnpm check` i `pnpm build`.
2. Zaimportować prywatne repozytorium w istniejącym koncie Vercel.
3. Potwierdzić właściwe konto/projekt i powyższe ustawienia.
4. Opublikować, sprawdzić HTTPS i zasoby PWA.
5. Na realnym telefonie sprawdzić zapis, ponowne otwarcie, instalację oraz offline.
6. Wybrać stabilny adres. Własną domenę dodawać dopiero po świadomym wyborze i osobnej zgodzie na ewentualny zakup.

Nie dodawać bazy ani usług integracyjnych tylko po to, by wdrożyć ten projekt. Vercel serwuje gotowe pliki. Nie zakładać, że prywatne repozytorium automatycznie oznacza prywatny adres strony — widoczność wdrożenia należy dobrać przy publikacji. Prywatne dane nie są częścią plików strony, ale katalog startowy i kod trafiają do przeglądarki każdego odwiedzającego.

## Aktualizacje i odzyskiwanie

- Przed większą zmianą wykonać eksport danych na używanych urządzeniach.
- Nie zmieniać nazwy bazy `pilates-flow` ani wersji schematu bez migracji.
- Sprawdzić starą kopię JSON z nowym buildem.
- Aplikacja proponuje odświeżenie, gdy nowy service worker jest gotowy.
- Cofnięcie wdrożenia przywraca kod, nie przywraca danych zapisanych na telefonie.
- Zmiana domeny/portu tworzy nowy origin. Wyeksportować dane ze starego adresu i zaimportować na nowym.
