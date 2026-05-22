import { View, Text, StyleSheet } from "react-native";
import type { LetterResult } from "@/domain/wordle.types";
import { WORD_LENGTH, MAX_GUESSES, TILE_SIZE, TILE_GAP, COLORS } from "@/domain/wordle.constants";

const STATUS_COLORS = {
  correct: COLORS.correct,
  present: COLORS.present,
  absent: COLORS.absent,
} as const;

type BoardProps = {
  guesses: LetterResult[][];
  maxGuesses?: number;
  currentGuess?: string;
};

function Tile({ result, preview }: { result?: LetterResult; preview?: string }) {
  if (result) {
    return (
      <View style={[styles.tile, { backgroundColor: STATUS_COLORS[result.status] }]}>
        <Text style={[styles.tileLetter, { color: COLORS.textInverse }]}>
          {result.letter.toUpperCase()}
        </Text>
      </View>
    );
  }

  const hasPreview = preview != null && preview.length > 0;

  return (
    <View
      style={[
        styles.tile,
        {
          borderWidth: 2,
          borderColor: hasPreview ? COLORS.absent : COLORS.emptyBorder,
          backgroundColor: "transparent",
        },
      ]}
    >
      <Text style={[styles.tileLetter, { color: hasPreview ? COLORS.text : "transparent" }]}>
        {hasPreview ? preview.toUpperCase() : ""}
      </Text>
    </View>
  );
}

export function Board({ guesses, maxGuesses = MAX_GUESSES, currentGuess = "" }: BoardProps) {
  const currentRowIndex = guesses.length;

  return (
    <View style={styles.board}>
      {Array.from({ length: maxGuesses }, (_, rowIndex) => {
        const isCurrentRow = rowIndex === currentRowIndex;
        const submittedRow = guesses[rowIndex];

        return (
          <View key={rowIndex} style={styles.row}>
            {Array.from({ length: WORD_LENGTH }, (_, colIndex) => (
              <Tile
                key={colIndex}
                result={submittedRow?.[colIndex]}
                preview={isCurrentRow ? currentGuess[colIndex] : undefined}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: TILE_GAP,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: TILE_GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  tileLetter: {
    fontSize: 28,
    fontWeight: "700",
    width: "100%",
    textAlign: "center",
  },
});
