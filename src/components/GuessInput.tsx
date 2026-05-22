import { useRef, useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { WORD_LENGTH, COLORS } from "@/domain/wordle.constants";

type GuessInputProps = {
  onChangeText: (text: string) => void;
  onSubmit: (guess: string) => void;
  disabled: boolean;
};

export function GuessInput({ onChangeText, onSubmit, disabled }: GuessInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [error, setError] = useState<string | null>(null);
  const currentText = useRef("");

  const handleChangeText = (raw: string) => {
    const cleaned = raw.replace(/[^a-zA-Z]/g, "");
    currentText.current = cleaned;
    onChangeText(cleaned);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    const normalized = currentText.current.toLowerCase();
    if (normalized.length !== WORD_LENGTH) {
      setError("Not enough letters");
      return;
    }
    try {
      onSubmit(normalized);
      setError(null);
      currentText.current = "";
      inputRef.current?.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid guess");
    }
    inputRef.current?.focus();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          style={[styles.input, disabled && styles.inputDisabled]}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          maxLength={WORD_LENGTH}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          returnKeyType="done"
          editable={!disabled}
          placeholder={`Type a ${WORD_LENGTH}-letter word`}
          placeholderTextColor={COLORS.placeholder}
        />
        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.emptyBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 4,
    textAlign: "center",
    color: COLORS.text,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: COLORS.correct,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.correctDisabled,
  },
  buttonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    color: COLORS.absent,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
});
