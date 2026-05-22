# Wordle Game

A Wordle clone built with React Native, Expo, and TypeScript. Runs on iOS, Android, and web.

## Screenshots

<!-- Add screenshots here -->
<!-- | Game Board | Winning | Game Over | -->
<!-- |:---:|:---:|:---:| -->
<!-- | ![Board](docs/board.png) | ![Win](docs/win.png) | ![Loss](docs/loss.png) | -->

## Approach

The project follows a **domain-first** architecture: types and pure logic are defined before any UI code. This separation means the game engine can be tested independently of React Native.

**Key decisions:**

- **Pure functions over stateful classes.** `submitGuess(state, guess)` returns a new immutable state — no side effects, no mutation. This makes the logic easy to test and reason about.
- **Two-pass letter evaluation.** The `evaluateGuess` algorithm handles duplicate letters correctly by first marking exact positional matches ("correct"), then scanning remaining letters for partial matches ("present"). This prevents the same target letter from being matched twice — a subtle bug in many Wordle implementations.
- **Word validation against a real dictionary.** Guesses are validated against the official 2,314-word Wordle answer list. Invalid words are rejected with user-visible feedback.
- **Tests before UI.** All domain logic was written and tested before building any React components.

## Model

The game state is represented by a single `WordleGameState` type:

```typescript
type WordleGameState = {
  targetWord: string;
  maxGuesses: number;
  guesses: LetterResult[][];      // each guess is an array of { letter, status }
  remainingGuesses: number;
  usedLetters: Record<string, LetterStatus>;  // tracks best status per letter for keyboard coloring
  status: GameStatus;             // "playing" | "won" | "lost"
};
```

State transitions are handled by two pure functions:

- `createInitialGameState(targetWord?, maxGuesses?)` — creates a fresh game with a random word from the answer pool.
- `submitGuess(state, guess)` — validates (length, characters, dictionary), evaluates, and returns the next state.

The `usedLetters` map tracks the "best" status per letter (`correct > present > absent`), ready for on-screen keyboard integration.

## What Works Well

- **Correct duplicate letter handling.** The two-pass algorithm (greens first, then yellows against remaining supply) handles all edge cases — tested with 8 dedicated scenarios including surplus duplicates and same-letter correct+present in one guess.
- **28 deterministic unit tests** covering all game paths: win, loss, playing, validation, normalization, immutability, multi-turn flows.
- **Clean domain/UI separation.** Components contain zero business logic — they only render state and dispatch actions.
- **Immutable state transitions.** Tests verify that `submitGuess` never mutates the input state.
- **Full toolchain.** `npm run check` runs TypeScript strict mode, ESLint, Prettier, and Jest in sequence.

## What Could Improve

- **On-screen keyboard.** `usedLetters` is tracked and ready but not yet visualized — a keyboard component would show which letters have been tried and their statuses.
- **Animations.** Tile flip on guess submission and shake on invalid words would improve feedback.
- **Accessibility.** Screen reader labels for tile colors, keyboard navigation support.
- **Dark mode.** Colors are centralized in constants but currently light-mode only.

## Trade-offs

| Decision | Why |
|----------|-----|
| Answer list as valid guesses | Using the 2,314-word answer list for validation instead of the full 13,000-word guess list. Keeps the bundle small while covering common words. |
| `usedLetters` tracked but not displayed | Prepares for on-screen keyboard without adding UI complexity now |
| `throw` on invalid guess | Fail-fast at the domain boundary; the UI catches and displays errors gracefully |
| Immutable state updates | Predictable transitions, easy to test, compatible with React's rendering model |
| Random target word from answer pool | Each game is unique without needing a backend |

## Running the Project

```bash
# Install dependencies
npm install

# Start the dev server (opens QR code for iOS/Android + web)
npx expo start

# Or run on a specific platform
npx expo start --ios
npx expo start --android
npx expo start --web

# Run all checks (typecheck + lint + format + tests)
npm run check

# Run tests only
npm test
```

## Project Structure

```
src/
  domain/
    wordle.types.ts       # Type definitions
    wordle.constants.ts   # Game constants and shared config (no magic values in UI)
    wordle.logic.ts       # Pure game logic (evaluateGuess, submitGuess)
    wordle.words.ts       # 2,314-word dictionary (official Wordle answer list)
  components/
    Board.tsx             # Game board grid with colored tiles and live preview
    GuessInput.tsx        # Text input with validation feedback
  screens/
    WordleScreen.tsx      # Main game screen
  __tests__/
    wordle.logic.test.ts  # 28 unit tests
```
