import { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, FlatList, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';

const COMMON_UNITS = [
  'g', 'kg', 'ml', 'l', 'cda', 'cdta', 'taza', 'unidad', 'pizca', 'al gusto',
  'oz', 'lb', 'paquete', 'lata', 'diente', 'ramita', 'hoja', 'rebanada',
];

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function UnitSelect({ value, onChange }: UnitSelectProps) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  function handleSelect(unit: string) {
    onChange(unit);
    setOpen(false);
    setCustomMode(false);
  }

  function handleCustom() {
    setCustomMode(true);
    setCustomValue('');
  }

  function handleCustomConfirm() {
    if (customValue.trim()) {
      onChange(customValue.trim());
    }
    setOpen(false);
    setCustomMode(false);
  }

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || 'Unidad'}
        </Text>
        <MaterialIcons name="unfold-more" size={16} color={Colors.brownLight} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            {customMode ? (
              <View style={styles.customContainer}>
                <Text style={styles.sheetTitle}>Unidad personalizada</Text>
                <TextInput
                  style={styles.customInput}
                  value={customValue}
                  onChangeText={setCustomValue}
                  placeholder="Escribe la unidad"
                  placeholderTextColor={Colors.brownLight}
                  autoFocus
                />
                <View style={styles.customButtons}>
                  <Pressable style={styles.cancelBtn} onPress={() => setOpen(false)}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </Pressable>
                  <Pressable style={styles.confirmBtn} onPress={handleCustomConfirm}>
                    <Text style={styles.confirmBtnText}>Aceptar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.sheetTitle}>Selecciona unidad</Text>
                <FlatList
                  data={COMMON_UNITS}
                  keyExtractor={item => item}
                  numColumns={3}
                  columnWrapperStyle={styles.gridRow}
                  contentContainerStyle={styles.grid}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.unitOption, value === item && styles.unitOptionSelected]}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={[styles.unitText, value === item && styles.unitTextSelected]}>
                        {item}
                      </Text>
                    </Pressable>
                  )}
                />
                <Pressable style={styles.customOption} onPress={handleCustom}>
                  <MaterialIcons name="edit" size={18} color={Colors.greenAccent} />
                  <Text style={styles.customOptionText}>Personalizado...</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    height: 40,
    width: 70,
  },
  triggerText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: Colors.brownDark,
  },
  placeholder: {
    color: Colors.brownLight,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  sheetTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
    marginBottom: Spacing.md,
  },
  grid: {
    gap: Spacing.sm,
  },
  gridRow: {
    gap: Spacing.sm,
    justifyContent: 'flex-start',
  },
  unitOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.tag,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  unitOptionSelected: {
    backgroundColor: Colors.greenAccent,
    borderColor: Colors.greenAccent,
  },
  unitText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.brownDark,
  },
  unitTextSelected: {
    color: Colors.white,
  },
  customOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  customOptionText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.greenAccent,
  },
  customContainer: {
    gap: Spacing.md,
  },
  customInput: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    minHeight: 48,
  },
  customButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.button,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.button,
    borderCurve: 'continuous',
    backgroundColor: Colors.greenAccent,
  },
  confirmBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.white,
  },
});
