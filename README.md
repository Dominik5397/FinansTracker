# FinansTracker 💰

> *Nowoczesna aplikacja do śledzenia finansów osobistych, zarządzania budżetem i analizy wydatków.*

[![Autor](https://img.shields.io/badge/Autor-Dominik%20Burda-blue)](https://github.com/Dominik5397)
[![Licencja](https://img.shields.io/badge/Licencja-MIT-green)](LICENSE)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB)](https://reactjs.org/)

## ✨ Funkcjonalności

- 📊 Dashboard z przeglądem finansów
- 💰 Rejestrowanie transakcji (przychody i wydatki)
- 📅 Planowanie budżetu
- 📱 Responsywny interfejs (dark/light mode)
- 🔔 System powiadomień
- 📈 Analizy i statystyki wydatków
- 🔐 Uwierzytelnianie i autoryzacja z Firebase

## 🛠️ Technologie

- ⚛️ React
- 📘 TypeScript
- 🎨 Material UI
- 🔥 Firebase (Auth, Firestore)
- 📊 Chart.js
- ✨ Framer Motion (animacje)

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/Dominik5397/FinansTracker.git
cd FinansTracker
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Utwórz projekt w Firebase:
   - Przejdź do [Firebase Console](https://console.firebase.google.com/)
   - Utwórz nowy projekt
   - Dodaj aplikację web do projektu
   - Włącz uwierzytelnianie (Email/Password)
   - Utwórz bazę danych Firestore

4. Skonfiguruj zmienne środowiskowe:
   - Skopiuj plik `.env.example` do `.env.local`
   - Uzupełnij dane projektu Firebase w pliku `.env.local`

```bash
cp .env.example .env.local
```

5. Uruchom aplikację:
```bash
npm start
```

## Struktura projektu

```
src/
├── assets/         # Pliki statyczne (obrazy, ikony)
├── components/     # Komponenty React
├── pages/          # Główne strony aplikacji
├── services/       # Usługi (Firebase, powiadomienia)
├── store/          # Zarządzanie stanem
├── types/          # Definicje typów TypeScript
└── utils/          # Funkcje pomocnicze
```

## Bezpieczeństwo

- Wszystkie operacje bazodanowe są zabezpieczone regułami Firestore
- Dostęp do danych jest ograniczony do właściciela
- Komunikacja z Firebase jest szyfrowana

## Licencja

[MIT](LICENSE)

## Konfiguracja Firebase

Aplikacja korzysta z Firebase jako backendu. Aby poprawnie skonfigurować połączenie z Firebase:

1. Utwórz projekt Firebase na [Firebase Console](https://console.firebase.google.com/)
2. W projekcie Firebase włącz usługi:
   - Authentication (z metodą Email/Password)
   - Firestore Database
   - Storage (opcjonalnie)
3. Skopiuj dane konfiguracyjne Firebase
4. Utwórz plik `.env.local` w głównym katalogu projektu i dodaj następujące zmienne:
   ```
   REACT_APP_FIREBASE_API_KEY=twój_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=twój_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=twój_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=twój_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=twój_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=twój_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=twój_measurement_id
   ```
5. Skonfiguruj reguły bezpieczeństwa Firestore:
   - Przejdź do sekcji "Firestore Database" > "Rules" w konsoli Firebase
   - Skopiuj i wklej reguły z pliku `firestore.rules` w tym projekcie
   - Opublikuj reguły

Uwaga: Plik `.env.local` zawiera poufne dane i nie powinien być dodawany do repozytorium git.

## Uruchamianie aplikacji na Windows

1. Upewnij się, że masz zainstalowany Node.js (wersja 14.x lub nowsza)
2. Otwórz wiersz poleceń (cmd) lub PowerShell jako administrator
3. Przejdź do katalogu z projektem:
   ```
   cd "ścieżka\do\projektu\expense-tracker"
   ```
4. Zainstaluj zależności:
   ```
   npm install --legacy-peer-deps
   ```
5. Uruchom aplikację:
   ```
   npm start
   ```
6. Aplikacja powinna uruchomić się automatycznie w przeglądarce pod adresem [http://localhost:3000](http://localhost:3000)

7. Jeśli masz problemy z kategoriami, użyj narzędzia DevTools (fioletowy przycisk w prawym dolnym rogu) do dodania domyślnych kategorii.

## Zarządzanie kategoriami

Aplikacja korzysta z kategorii przechowywanych w bazie danych Firebase. Dla nowych użytkowników, przy pierwszym logowaniu zostaną automatycznie dodane domyślne kategorie:

### Kategorie wydatków:
- Jedzenie
- Transport
- Rachunki
- Zakupy 
- Rozrywka
- Zdrowie
- Edukacja
- Inne wydatki

### Kategorie przychodów:
- Wynagrodzenie
- Freelancing
- Inwestycje
- Zwroty
- Prezenty
- Inne przychody

Jeśli chcesz dodać własne kategorie, możesz to zrobić za pomocą panelu DevTools:

1. Zalogować się do aplikacji
2. Kliknąć fioletowy przycisk z ikoną robaka (DevTools) w prawym dolnym rogu
3. Wypełnić formularz "Dodaj nową kategorię do bazy danych" i zatwierdzić

### Rozwiązywanie problemów z kategoriami

Jeśli w aplikacji występują problemy z kategoriami:

1. Kliknąć fioletowy przycisk z ikoną robaka w prawym dolnym rogu (DevTools)
2. Użyć przycisku "Sprawdź kategorie w bazie" aby zobaczyć aktualnie dostępne kategorie (wyświetlą się w konsoli przeglądarki)
3. Jeśli występują duplikaty kategorii, użyć przycisku "Wyczyść duplikaty" aby usunąć zduplikowane kategorie

Funkcja "Wyczyść duplikaty" identyfikuje wszystkie duplikaty kategorii o tej samej nazwie i typie, 
zachowując tylko najlepszą wersję każdej kategorii (z poprawną ikoną i kolorem), 
a pozostałe usuwa. Po zakończeniu czyszczenia strona zostanie automatycznie odświeżona.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Bezpieczeństwo danych

Projekt używa Firebase jako backendu i przechowuje poufne dane. Pamiętaj:

1. **NIE** commituj plików `.env`, `.env.local` ani żadnych innych zawierających klucze API
2. Używaj reguł Firestore do zabezpieczenia dostępu do danych
3. Skonfiguruj CORS w projekcie Firebase
4. Zaimplementuj odpowiednie uwierzytelnianie i autoryzację
5. Regularnie sprawdzaj uprawnienia użytkowników

```
// Przykład reguł Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 👨‍💻 O autorze

### Dominik Burda

Jestem pasjonatem technologii i programowania, szczególnie zainteresowanym rozwiązaniami webowymi i mobilnymi. Ten projekt powstał z potrzeby lepszego zarządzania własnymi finansami i chęci rozwijania umiejętności w React i Firebase.

#### Kontakt

- 🌐 [GitHub](https://github.com/Dominik5397)
- 📧 Email: [kontakt@dominikburda.pl](mailto:kontakt@dominikburda.pl)

---

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Przygotowanie do produkcji

### Zmienne środowiskowe

Przed wdrożeniem do produkcji upewnij się, że:

1. Używasz zmiennych środowiskowych produkcyjnych, a nie deweloperskich
2. Zabezpieczyłeś dostęp do projektu Firebase przez ograniczenie domen w konsoli Firebase
3. Przeprowadziłeś testy bezpieczeństwa

### Wdrożenie

Aby zbudować wersję produkcyjną:

```bash
npm run build
```

Utworzone pliki będą w katalogu `build/`, który można hostować na dowolnej platformie statycznych stron (Netlify, Vercel, Firebase Hosting).

### Wdrożenie na Firebase Hosting

1. Zainstaluj Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Zaloguj się do Firebase:
```bash
firebase login
```

3. Zainicjuj projekt:
```bash
firebase init
```

4. Wdróż na hosting:
```bash
firebase deploy
```
