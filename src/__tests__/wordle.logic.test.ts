import {
  createInitialGameState,
  evaluateGuess,
  submitGuess,
  getRandomWord,
} from "../domain/wordle.logic";
import { VALID_WORDS } from "../domain/wordle.words";

describe("getRandomWord", () => {
  it("returns a word from the valid words list", () => {
    const word = getRandomWord();
    expect(VALID_WORDS.has(word)).toBe(true);
    expect(word).toHaveLength(5);
  });
});

describe("createInitialGameState", () => {
  it("creates a fresh game state with the given target word", () => {
    const state = createInitialGameState("react");

    expect(state.targetWord).toBe("react");
    expect(state.maxGuesses).toBe(6);
    expect(state.guesses).toEqual([]);
    expect(state.remainingGuesses).toBe(6);
    expect(state.usedLetters).toEqual({});
    expect(state.status).toBe("playing");
  });

  it("picks a random word when no target is provided", () => {
    const state = createInitialGameState();
    expect(VALID_WORDS.has(state.targetWord)).toBe(true);
  });
});

describe("evaluateGuess", () => {
  it("marks all letters correct for an exact match", () => {
    const result = evaluateGuess("react", "react");

    expect(result).toEqual([
      { letter: "r", status: "correct" },
      { letter: "e", status: "correct" },
      { letter: "a", status: "correct" },
      { letter: "c", status: "correct" },
      { letter: "t", status: "correct" },
    ]);
  });

  it("marks letters as present when in wrong position", () => {
    const result = evaluateGuess("trace", "react");

    expect(result).toEqual([
      { letter: "t", status: "present" },
      { letter: "r", status: "present" },
      { letter: "a", status: "correct" },
      { letter: "c", status: "correct" },
      { letter: "e", status: "present" },
    ]);
  });

  it("marks all letters absent when none exist in target", () => {
    const result = evaluateGuess("plumb", "react");

    expect(result).toEqual([
      { letter: "p", status: "absent" },
      { letter: "l", status: "absent" },
      { letter: "u", status: "absent" },
      { letter: "m", status: "absent" },
      { letter: "b", status: "absent" },
    ]);
  });

  it("handles duplicate letters — only marks as many as exist in target", () => {
    // target "eagle" has two e's: positions 0 and 4
    // guess  "geese" has three e's: positions 1, 2, 4
    const result = evaluateGuess("geese", "eagle");

    expect(result[0]).toEqual({ letter: "g", status: "present" });
    expect(result[1]).toEqual({ letter: "e", status: "present" });
    expect(result[2]).toEqual({ letter: "e", status: "absent" }); // no more e's available
    expect(result[3]).toEqual({ letter: "s", status: "absent" });
    expect(result[4]).toEqual({ letter: "e", status: "correct" }); // exact match at pos 4
  });

  it("prioritizes exact match over partial when duplicates exist", () => {
    // target "abcde", guess "aaccc"
    // a: pos 0 exact, pos 1 absent (only one a in target)
    // c: pos 2 correct, pos 3 absent, pos 4 absent (only one c in target)
    const result = evaluateGuess("aaccc", "abcde");

    expect(result[0]).toEqual({ letter: "a", status: "correct" });
    expect(result[1]).toEqual({ letter: "a", status: "absent" });
    expect(result[2]).toEqual({ letter: "c", status: "correct" });
    expect(result[3]).toEqual({ letter: "c", status: "absent" });
    expect(result[4]).toEqual({ letter: "c", status: "absent" });
  });

  it("handles all same letter guess against target with limited supply", () => {
    // guess "eeeee" vs target "react" (only 1 e at position 1)
    const result = evaluateGuess("eeeee", "react");

    expect(result[0]).toEqual({ letter: "e", status: "absent" });
    expect(result[1]).toEqual({ letter: "e", status: "correct" }); // exact match
    expect(result[2]).toEqual({ letter: "e", status: "absent" });
    expect(result[3]).toEqual({ letter: "e", status: "absent" });
    expect(result[4]).toEqual({ letter: "e", status: "absent" });
  });

  it("handles same letter as both correct and present in one guess", () => {
    // target: e(0) l(1) d(2) e(3) r(4) — two e's
    // guess:  m(0) e(1) l(2) e(3) e(4)
    // Pass 1: e(3) exact → correct. Pass 2: e(1) → unconsumed e(0) → present, e(4) → no more e → absent
    const result = evaluateGuess("melee", "elder");

    expect(result[0]).toEqual({ letter: "m", status: "absent" });
    expect(result[1]).toEqual({ letter: "e", status: "present" }); // e found at unconsumed pos 0
    expect(result[2]).toEqual({ letter: "l", status: "present" }); // l found at unconsumed pos 1
    expect(result[3]).toEqual({ letter: "e", status: "correct" }); // exact match
    expect(result[4]).toEqual({ letter: "e", status: "absent" }); // no more e's available
  });

  it("gives yellow to first duplicate and gray to surplus", () => {
    // target "close" has 1 e at pos 4. Guess "cheer" has 2 e's.
    // Only the first unmatched e gets yellow; the surplus gets gray.
    const result = evaluateGuess("cheer", "close");

    expect(result[0]).toEqual({ letter: "c", status: "correct" });
    expect(result[1]).toEqual({ letter: "h", status: "absent" });
    expect(result[2]).toEqual({ letter: "e", status: "present" }); // first e gets yellow
    expect(result[3]).toEqual({ letter: "e", status: "absent" }); // surplus e gets gray
    expect(result[4]).toEqual({ letter: "r", status: "absent" });
  });
});

describe("submitGuess", () => {
  const initialState = createInitialGameState("react");

  // --- Scenario A: correct guess → game won ---

  it("returns won state when guess matches target", () => {
    const result = submitGuess(initialState, "react");

    expect(result.status).toBe("won");
    expect(result.guesses).toHaveLength(1);
    expect(result.remainingGuesses).toBe(5);
    expect(result.guesses[0]).toEqual([
      { letter: "r", status: "correct" },
      { letter: "e", status: "correct" },
      { letter: "a", status: "correct" },
      { letter: "c", status: "correct" },
      { letter: "t", status: "correct" },
    ]);
  });

  // --- Scenario B: incorrect guess with attempts remaining ---

  it("keeps playing and returns letter feedback on incorrect guess", () => {
    const result = submitGuess(initialState, "trace");

    expect(result.status).toBe("playing");
    expect(result.guesses).toHaveLength(1);
    expect(result.remainingGuesses).toBe(5);
    expect(result.guesses[0]).toEqual([
      { letter: "t", status: "present" },
      { letter: "r", status: "present" },
      { letter: "a", status: "correct" },
      { letter: "c", status: "correct" },
      { letter: "e", status: "present" },
    ]);
  });

  it("decrements remaining guesses on fully wrong guess", () => {
    const result = submitGuess(initialState, "plumb");

    expect(result.status).toBe("playing");
    expect(result.guesses).toHaveLength(1);
    expect(result.remainingGuesses).toBe(5);
    expect(result.guesses[0]).toEqual([
      { letter: "p", status: "absent" },
      { letter: "l", status: "absent" },
      { letter: "u", status: "absent" },
      { letter: "m", status: "absent" },
      { letter: "b", status: "absent" },
    ]);
  });

  // --- Scenario C: incorrect guess, no attempts left → game over ---

  it("returns lost state after last incorrect guess", () => {
    let state = createInitialGameState("react", 1);
    state = submitGuess(state, "plumb");

    expect(state.status).toBe("lost");
    expect(state.remainingGuesses).toBe(0);
    expect(state.guesses).toHaveLength(1);
  });

  // --- Validation edge cases ---

  it("throws on guess that is too short", () => {
    expect(() => submitGuess(initialState, "hi")).toThrow("Guess must be exactly 5 letters");
  });

  it("throws on guess that is too long", () => {
    expect(() => submitGuess(initialState, "toolong")).toThrow("Guess must be exactly 5 letters");
  });

  it("throws on empty string", () => {
    expect(() => submitGuess(initialState, "")).toThrow("Guess must be exactly 5 letters");
  });

  it("throws on word not in dictionary", () => {
    expect(() => submitGuess(initialState, "zzzzz")).toThrow("Not in word list");
    expect(() => submitGuess(initialState, "abcde")).toThrow("Not in word list");
  });

  it("throws on non-alphabetic characters", () => {
    expect(() => submitGuess(initialState, "he!!o")).toThrow("Guess must contain only letters");
    expect(() => submitGuess(initialState, "12345")).toThrow("Guess must contain only letters");
    expect(() => submitGuess(initialState, "ab cd")).toThrow("Guess must contain only letters");
  });

  // --- Game over guards ---

  it("ignores guesses when game is already won", () => {
    const wonState = submitGuess(initialState, "react");
    const result = submitGuess(wonState, "plumb");

    expect(result).toBe(wonState); // same reference — no mutation
  });

  it("ignores guesses when game is already lost", () => {
    let state = createInitialGameState("react", 1);
    state = submitGuess(state, "plumb");
    const result = submitGuess(state, "react");

    expect(result).toBe(state);
    expect(result.status).toBe("lost");
  });

  // --- Normalization ---

  it("normalizes uppercase guess to lowercase", () => {
    const result = submitGuess(initialState, "REACT");

    expect(result.status).toBe("won");
  });

  it("normalizes mixed case guess to lowercase", () => {
    const result = submitGuess(initialState, "ReAcT");

    expect(result.status).toBe("won");
  });

  // --- State tracking ---

  it("tracks used letters with best status across guesses", () => {
    let state = submitGuess(initialState, "trace"); // t:present, r:present, a:correct, c:present, e:present
    state = submitGuess(state, "react"); // r:correct, e:correct, a:correct, c:correct, t:correct

    expect(state.usedLetters.r).toBe("correct");
    expect(state.usedLetters.e).toBe("correct");
    expect(state.usedLetters.a).toBe("correct");
    expect(state.usedLetters.c).toBe("correct");
    expect(state.usedLetters.t).toBe("correct");
  });

  it("tracks absent letters in usedLetters", () => {
    const result = submitGuess(initialState, "plumb");

    expect(result.usedLetters.p).toBe("absent");
    expect(result.usedLetters.l).toBe("absent");
    expect(result.usedLetters.u).toBe("absent");
    expect(result.usedLetters.m).toBe("absent");
    expect(result.usedLetters.b).toBe("absent");
  });

  it("does not downgrade a letter status from correct to present or absent", () => {
    // First guess has 'a' as correct at position 2
    let state = submitGuess(initialState, "trace");
    expect(state.usedLetters.a).toBe("correct");

    // Second guess has 'a' as absent (not in "plumb" sense — but 'a' at wrong pos)
    state = submitGuess(state, "plumb");
    // 'a' should still be "correct" from the first guess
    expect(state.usedLetters.a).toBe("correct");
  });

  // --- Immutability ---

  it("does not mutate the original state", () => {
    const original = createInitialGameState("react");
    const originalGuessesRef = original.guesses;
    const originalUsedLettersRef = original.usedLetters;

    submitGuess(original, "plumb");

    expect(original.guesses).toBe(originalGuessesRef);
    expect(original.guesses).toHaveLength(0);
    expect(original.usedLetters).toBe(originalUsedLettersRef);
    expect(original.remainingGuesses).toBe(6);
    expect(original.status).toBe("playing");
  });

  // --- Multi-turn game flow ---

  it("allows submitting the same word twice", () => {
    let state = submitGuess(initialState, "plumb");
    state = submitGuess(state, "plumb");

    expect(state.status).toBe("playing");
    expect(state.guesses).toHaveLength(2);
    expect(state.remainingGuesses).toBe(4);
    expect(state.guesses[0]).toEqual(state.guesses[1]);
  });

  it("plays through a full losing game (6 wrong guesses)", () => {
    let state = createInitialGameState("react");
    const wrongGuesses = ["plumb", "sight", "funky", "blown", "dwarf", "glyph"];

    for (const guess of wrongGuesses) {
      state = submitGuess(state, guess);
    }

    expect(state.status).toBe("lost");
    expect(state.guesses).toHaveLength(6);
    expect(state.remainingGuesses).toBe(0);
  });

  it("wins on the last available attempt", () => {
    let state = createInitialGameState("react");
    const wrongGuesses = ["plumb", "sight", "funky", "blown", "dwarf"];

    for (const guess of wrongGuesses) {
      state = submitGuess(state, guess);
    }

    expect(state.remainingGuesses).toBe(1);
    state = submitGuess(state, "react");

    expect(state.status).toBe("won");
    expect(state.guesses).toHaveLength(6);
    expect(state.remainingGuesses).toBe(0);
  });
});
