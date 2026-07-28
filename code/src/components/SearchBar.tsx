import { useState, useEffect, useRef } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '@/lib/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Buscar recetas...',
  onSubmitEditing,
}: SearchBarProps) {
  const [text, setText] = useState(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setText(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (text !== value) {
        onChangeText(text);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [text, value, onChangeText]);

  const handleClear = () => {
    setText('');
    onClear?.();
  };

  return (
    <View style={styles.wrapper}>
      <MaterialIcons name="search" size={20} color={Colors.brownLight} />
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={Colors.brownLight}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        autoCorrect={false}
      />
      {text ? (
        <Pressable onPress={handleClear} hitSlop={8}>
          <MaterialIcons name="close" size={18} color={Colors.brownLight} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    padding: 0,
    height: 44,
  },
});
