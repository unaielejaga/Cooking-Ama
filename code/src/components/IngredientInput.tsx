import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { Ingredient } from '@/lib/types';
import { UnitSelect } from './UnitSelect';

interface IngredientInputProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

let nextId = 1;
function generateId() {
  return `ing_${nextId++}_${Date.now()}`;
}

function createEmpty(): Ingredient {
  return { id: generateId(), quantity: '', unit: '', name: '' };
}

export function IngredientInput({ ingredients, onChange }: IngredientInputProps) {
  function updateIngredient(id: string, field: keyof Ingredient, value: string) {
    onChange(
      ingredients.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  }

  function removeIngredient(id: string) {
    onChange(ingredients.filter(ing => ing.id !== id));
  }

  function addIngredient() {
    onChange([...ingredients, createEmpty()]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ingredientes</Text>

      {ingredients.map((ingredient, index) => (
        <View key={ingredient.id} style={styles.row}>
          <Text style={styles.index}>{index + 1}</Text>
          <TextInput
            style={[styles.input, styles.smallInput]}
            value={ingredient.quantity}
            onChangeText={v => updateIngredient(ingredient.id, 'quantity', v)}
            placeholder="Cant."
            placeholderTextColor={Colors.brownLight}
            keyboardType="decimal-pad"
          />
          <UnitSelect
            value={ingredient.unit}
            onChange={v => updateIngredient(ingredient.id, 'unit', v)}
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            value={ingredient.name}
            onChangeText={v => updateIngredient(ingredient.id, 'name', v)}
            placeholder="Nombre"
            placeholderTextColor={Colors.brownLight}
          />
          <Pressable
            style={styles.deleteButton}
            onPress={() => removeIngredient(ingredient.id)}
          >
            <MaterialIcons name="close" size={18} color={Colors.error} />
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.addButton} onPress={addIngredient}>
        <MaterialIcons name="add" size={18} color={Colors.greenAccent} />
        <Text style={styles.addButtonText}>Agregar ingrediente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  index: {
    width: 20,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.caption,
    color: Colors.brownDark,
    minHeight: 40,
  },
  smallInput: {
    width: 50,
    textAlign: 'center',
  },
  unitInput: {
    width: 70,
  },
  nameInput: {
    flex: 1,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  addButtonText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.greenAccent,
  },
});
