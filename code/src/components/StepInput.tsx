import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { Step } from '@/lib/types';

interface StepInputProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

let nextId = 1;
function generateId() {
  return `stp_${nextId++}_${Date.now()}`;
}

function createEmpty(index: number): Step {
  return { id: generateId(), step_number: index, description: '' };
}

export function StepInput({ steps, onChange }: StepInputProps) {
  function updateStep(id: string, description: string) {
    onChange(
      steps.map(step => (step.id === id ? { ...step, description } : step))
    );
  }

  function removeStep(id: string) {
    const filtered = steps
      .filter(step => step.id !== id)
      .map((step, i) => ({ ...step, step_number: i + 1 }));
    onChange(filtered);
  }

  function addStep() {
    onChange([...steps, createEmpty(steps.length + 1)]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pasos</Text>

      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Pressable
              style={styles.deleteButton}
              onPress={() => removeStep(step.id)}
            >
              <MaterialIcons name="close" size={18} color={Colors.error} />
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={step.description}
            onChangeText={v => updateStep(step.id, v)}
            placeholder="Describe este paso..."
            placeholderTextColor={Colors.brownLight}
            multiline
            textAlignVertical="top"
          />
        </View>
      ))}

      <Pressable style={styles.addButton} onPress={addStep}>
        <MaterialIcons name="add" size={18} color={Colors.greenAccent} />
        <Text style={styles.addButtonText}>Agregar paso</Text>
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
  stepCard: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.greenAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  input: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    minHeight: 60,
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
