import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { GroupWithDetails } from '@/lib/types';

interface GroupCardProps {
  group: GroupWithDetails;
  onPress: (group: GroupWithDetails) => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(group)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="group" size={32} color={Colors.greenAccent} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          {group.is_admin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>

        {group.description && (
          <Text style={styles.description} numberOfLines={2}>
            {group.description}
          </Text>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialIcons name="people" size={14} color={Colors.brownLight} />
            <Text style={styles.statText}>
              {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
            </Text>
          </View>
          <View style={styles.stat}>
            <MaterialIcons name="menu-book" size={14} color={Colors.brownLight} />
            <Text style={styles.statText}>
              {group.recipe_count} {group.recipe_count === 1 ? 'receta' : 'recetas'}
            </Text>
          </View>
        </View>
      </View>

      <MaterialIcons name="chevron-right" size={24} color={Colors.brownLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
    flex: 1,
  },
  adminBadge: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.tag,
    borderCurve: 'continuous',
  },
  adminText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Colors.greenAccent,
  },
  description: {
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
  },
});
