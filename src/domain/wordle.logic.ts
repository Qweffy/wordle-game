import { WORD_LENGTH, MAX_GUESSES } from "./wordle.constants";
import type { LetterResult, LetterStatus, WordleGameState } from "./wordle.types";
import { VALID_WORDS, ANSWER_WORDS } from "./wordle.words";

export function getRandomWord(): string {
  return ANSWER_WORDS[Math.floor(Math.random() * ANSWER_WORDS.length)];
}

export function createInitialGameState(
  targetWord?: string,
  maxGuesses: number = MAX_GUESSES,
): WordleGameState {
  return {
    targetWord: (targetWord ?? getRandomWord()).toLowerCase(),
    maxGuesses,
    guesses: [],
    remainingGuesses: maxGuesses,
    usedLetters: {},
    status: "playing",
  };
}

/**
 * Two-pass algorithm to correctly handle duplicate letters.
 *
 * Pass 1: Mark exact positional matches ("correct") and consume those
 *         target letters so they can't be matched again.
 * Pass 2: For remaining letters, check against unconsumed target letters.
 *         If found → "present" (and consume it). Otherwise → "absent".
 */
export function evaluateGuess(guess: string, targetWord: string): LetterResult[] {
  const guessLetters = guess.toLowerCase().split("");
  const targetLetters = targetWord.toLowerCase().split("");
  const result: LetterResult[] = guessLetters.map((letter) => ({
    letter,
    status: "absent" as LetterStatus,
  }));

  const consumed = new Array<boolean>(targetLetters.length).fill(false);

  // Pass 1: exact matches
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i].status = "correct";
      consumed[i] = true;
    }
  }

  // Pass 2: partial matches against unconsumed target letters
  for (let i = 0; i < guessLetters.length; i++) {
    if (result[i].status === "correct") continue;

    const unusedIndex = targetLetters.findIndex((t, j) => !consumed[j] && t === guessLetters[i]);

    if (unusedIndex !== -1) {
      result[i].status = "present";
      consumed[unusedIndex] = true;
    }
  }

  return result;
}

const STATUS_PRIORITY: Record<LetterStatus, number> = {
  correct: 2,
  present: 1,
  absent: 0,
};

function mergeUsedLetters(
  current: Record<string, LetterStatus>,
  results: LetterResult[],
): Record<string, LetterStatus> {
  const updated = { ...current };

  for (const { letter, status } of results) {
    const existing = updated[letter];
    if (!existing || STATUS_PRIORITY[status] > STATUS_PRIORITY[existing]) {
      updated[letter] = status;
    }
  }

  return updated;
}

export function submitGuess(state: WordleGameState, guess: string): WordleGameState {
  if (state.status !== "playing") {
    return state;
  }

  const normalizedGuess = guess.toLowerCase();

  if (normalizedGuess.length !== WORD_LENGTH) {
    throw new Error(`Guess must be exactly ${WORD_LENGTH} letters. Got ${normalizedGuess.length}.`);
  }

  if (!/^[a-z]+$/.test(normalizedGuess)) {
    throw new Error("Guess must contain only letters (a-z).");
  }

  if (!VALID_WORDS.has(normalizedGuess)) {
    throw new Error("Not in word list.");
  }

  const results = evaluateGuess(normalizedGuess, state.targetWord);
  const newGuesses = [...state.guesses, results];
  const newRemainingGuesses = state.remainingGuesses - 1;
  const isCorrect = normalizedGuess === state.targetWord;

  let newStatus: WordleGameState["status"] = "playing";
  if (isCorrect) {
    newStatus = "won";
  } else if (newRemainingGuesses === 0) {
    newStatus = "lost";
  }

  return {
    ...state,
    guesses: newGuesses,
    remainingGuesses: newRemainingGuesses,
    usedLetters: mergeUsedLetters(state.usedLetters, results),
    status: newStatus,
  };
}
