import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { Collection } from '@/lib/types';

interface CollectionCardProps {
  collection: Collection;
  recipeCount: number;
  onPress: (collection: Collection) => void;
}

export function CollectionCard({ collection, recipeCount, onPress }: CollectionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(collection)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="bookmark" size={22} color={Colors.greenAccent} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {collection.name}
        </Text>
        {collection.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {collection.description}
          </Text>
        ) : null}
        <Text style={styles.count}>
          {recipeCount} {recipeCount === 1 ? 'receta' : 'recetas'}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={Colors.brownLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  description: {
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
  },
  count: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
    fontWeight: FontWeight.medium,
  },
});
