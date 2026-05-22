export type GameStatus = "playing" | "won" | "lost";

export type LetterStatus = "correct" | "present" | "absent";

export type LetterResult = {
  letter: string;
  status: LetterStatus;
};

export type WordleGameState = {
  targetWord: string;
  maxGuesses: number;
  guesses: LetterResult[][];
  remainingGuesses: number;
  usedLetters: Record<string, LetterStatus>;
  status: GameStatus;
};
