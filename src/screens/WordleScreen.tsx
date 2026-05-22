import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Board } from "@/components/Board";
import { GuessInput } from "@/components/GuessInput";
import { createInitialGameState, submitGuess } from "@/domain/wordle.logic";
import { COLORS } from "@/domain/wordle.constants";

export function WordleScreen() {
  const [gameState, setGameState] = useState(() => createInitialGameState());
  const [currentText, setCurrentText] = useState("");

  const handleGuess = useCallback(
    (guess: string) => {
      const newState = submitGuess(gameState, guess);
      setGameState(newState);
      setCurrentText("");
    },
    [gameState],
  );

  const handlePlayAgain = useCallback(() => {
    setGameState(createInitialGameState());
    setCurrentText("");
  }, []);

  const isGameOver = gameState.status !== "playing";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Wordle</Text>

      <View style={styles.boardSection}>
        <Board
          guesses={gameState.guesses}
          maxGuesses={gameState.maxGuesses}
          currentGuess={currentText}
        />

        {gameState.status === "playing" && (
          <Text style={styles.counter}>
            Attempt {gameState.guesses.length + 1} / {gameState.maxGuesses}
          </Text>
        )}
      </View>

      {gameState.status === "won" && <Text style={styles.message}>You won!</Text>}

      {gameState.status === "lost" && (
        <Text style={styles.message}>
          Game over! The word was{" "}
          <Text style={styles.revealedWord}>{gameState.targetWord.toUpperCase()}</Text>
        </Text>
      )}

      {isGameOver ? (
        <Pressable style={styles.playAgainButton} onPress={handlePlayAgain}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </Pressable>
      ) : (
        <GuessInput onChangeText={setCurrentText} onSubmit={handleGuess} disabled={isGameOver} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 24,
    color: COLORS.text,
  },
  boardSection: {
    alignItems: "center",
  },
  counter: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.absent,
    marginTop: 12,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
    color: COLORS.text,
  },
  revealedWord: {
    fontWeight: "800",
    color: COLORS.correct,
  },
  playAgainButton: {
    marginTop: 16,
    backgroundColor: COLORS.correct,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  playAgainText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
});
