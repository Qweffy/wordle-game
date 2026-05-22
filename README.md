# Wordle Game

A React Native + TypeScript implementation of a Wordle-style game. Runs on iOS, Android, and web.

The focus of this exercise is the game state model, pure state transition logic, and test coverage. The UI is intentionally simple and exists to demonstrate the game flow.

## Screenshots

<!-- Add screenshots here -->
<!-- | Game Board | Winning | Game Over | -->
<img width="485" height="1025" alt="image" src="https://github.com/user-attachments/assets/227f0e92-692f-4c05-93fe-03442728f478" />
<img width="500" height="1035" alt="image" src="https://github.com/user-attachments/assets/596659bc-ac4d-406c-b1c7-68db297b658b" />
<img width="519" height="1039" alt="image" src="https://github.com/user-attachments/assets/df37ff8d-594f-4f16-95bb-059d2fe6082b" />



<!-- |:---:|:---:|:---:| -->
<!-- | ![Board](docs/board.png) | ![Win](docs/win.png) | ![Loss](docs/loss.png) | -->

## Approach

The core game behavior is implemented with pure TypeScript functions, separated from the React Native UI. This makes the game easier to test, reason about, and reuse independently from the UI layer.

The React Native screen only manages user interaction and renders the current game state.

Key decisions:

- **Pure functions over stateful classes.** `submitGuess(state, guess)` returns a new immutable state with no side effects.
- **Two-pass letter evaluation.** The `evaluateGuess` algorithm marks exact positional matches first, then scans remaining letters for partial matches. This correctly handles duplicate letters without counting the same target letter twice.
- **Word validation.** Guesses are validated against the official 2,315-word Wordle answer list. Invalid words are rejected with user-visible feedback.
- **Tests before UI.** All domain logic was written and tested before building any React components.

## Model

The game state is represented by a single `WordleGameState` type:

```typescript
type WordleGameState = {
  targetWord: string;
  maxGuesses: number;
  guesses: LetterResult[][];
  remainingGuesses: number;
  usedLetters: Record<string, LetterStatus>;
  status: GameStatus; // "playing" | "won" | "lost"
};
```

Each guessed letter has one of three statuses:

- `correct` — the letter is in the target word and in the correct position
- `present` — the letter is in the target word but in a different position
- `absent` — the letter is not in the target word

State transitions are handled by two pure functions:

- `createInitialGameState(targetWord?, maxGuesses?)` — creates a fresh game with a random word from the answer pool.
- `submitGuess(state, guess)` — normalizes, validates (length, characters, dictionary), evaluates letter statuses, and returns the next immutable state.

## Review and Testing

The domain logic is covered with 31 unit tests.

The tests cover:

- Winning with a correct guess
- Submitting an incorrect guess while attempts remain
- Losing after the final incorrect guess
- Rejecting guesses with invalid length, non-alphabetic characters, or words not in the dictionary
- Duplicate letter evaluation (8 dedicated scenarios including surplus duplicates and same-letter correct+present)
- Case normalization
- Immutability verification (original state is never mutated)
- Multi-turn game flows (full 6-guess loss, win on last attempt)
- `usedLetters` status tracking and priority (correct > present > absent)

The tests focus on the pure TypeScript logic rather than the UI, because that is where the core game behavior lives.

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| Answer list as valid guesses | Using the 2,315-word answer list for validation instead of the full 13,000-word guess list. Keeps the bundle small while covering common words. |
| `usedLetters` tracked but not displayed | Prepared for on-screen keyboard integration without adding UI complexity now. |
| `throw` on invalid guess | Fail-fast at the domain boundary. The UI catches errors and displays them inline. |
| Random target from answer pool | Each game is unique without needing a backend. |
| Uncontrolled TextInput | Avoids a known React Native iOS bug where controlled inputs with `autoCapitalize` drop characters. |

## Next Steps

With more time:

- On-screen keyboard showing used letter statuses
- Tile flip and shake animations
- Accessibility (screen reader labels, keyboard navigation)
- Dark mode
- Game state persistence across sessions

## Running the Project

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Run on a specific platform
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
    wordle.constants.ts   # Game constants and shared config
    wordle.logic.ts       # Pure game logic (evaluateGuess, submitGuess)
    wordle.words.ts       # 2,315-word dictionary (official Wordle answer list)
  components/
    Board.tsx             # Game board grid with colored tiles and live preview
    GuessInput.tsx        # Text input with validation feedback
  screens/
    WordleScreen.tsx      # Main game screen
  __tests__/
    wordle.logic.test.ts  # 31 unit tests
```
