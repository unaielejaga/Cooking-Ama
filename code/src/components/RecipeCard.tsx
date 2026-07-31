import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { getRecipeImageUrl } from '@/lib/supabase';
import { Recipe } from '@/lib/types';
import { FavoriteButton } from '@/components/FavoriteButton';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  sharedGroupNames?: string[];
  variant?: 'list' | 'grid';
  isFavorited?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
}

const DIFFICULTIES: Record<string, { label: string; color: string }> = {
  easy: { label: 'Fácil', color: Colors.success },
  medium: { label: 'Media', color: Colors.warning },
  hard: { label: 'Difícil', color: Colors.error },
};

function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function RecipeCard({ recipe, onPress, sharedGroupNames, variant = 'list', isFavorited, onToggleFavorite }: RecipeCardProps) {
  const isGrid = variant === 'grid';
  const diff = recipe.difficulty ? DIFFICULTIES[recipe.difficulty] : null;
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const timeLabel = formatTime(totalTime || null);
  const authorName = recipe.author?.display_name || recipe.author?.username || '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isGrid ? styles.cardGrid : styles.cardList,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(recipe)}
    >
      <View style={isGrid ? styles.imageContainerGrid : styles.imageContainerList}>
        {recipe.image_url ? (
          <Image source={{ uri: getRecipeImageUrl(recipe.image_url) ?? '' }} style={isGrid ? styles.imageGrid : styles.imageList} />
        ) : (
          <View style={isGrid ? styles.imagePlaceholderGrid : styles.imagePlaceholderList}>
            <MaterialIcons name="restaurant" size={isGrid ? 28 : 40} color={Colors.brownLight} />
          </View>
        )}
        {!recipe.is_public && (
          <View style={styles.privateBadge}>
            <MaterialIcons name="lock" size={12} color={Colors.white} />
          </View>
        )}
        {onToggleFavorite && (
          <FavoriteButton
            recipeId={recipe.id}
            isFavorited={!!isFavorited}
            onToggle={onToggleFavorite}
            size={isGrid ? 28 : 32}
            style={styles.favoriteButton}
          />
        )}
      </View>

      <View style={isGrid ? styles.contentGrid : styles.contentList}>
        <Text style={isGrid ? styles.titleGrid : styles.titleList} numberOfLines={2}>
          {recipe.title}
        </Text>

        <View style={styles.authorRow}>
          {recipe.author?.avatar_url ? (
            <Image source={{ uri: recipe.author.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(authorName)}</Text>
            </View>
          )}
          <Text style={styles.authorName} numberOfLines={1}>
            {authorName}
          </Text>
        </View>

        <View style={styles.badges}>
          {diff && (
            <View style={[styles.badge, { backgroundColor: diff.color + '20' }]}>
              <Text style={[styles.badgeText, { color: diff.color }]}>{diff.label}</Text>
            </View>
          )}
          {timeLabel && (
            <View style={styles.badge}>
              <MaterialIcons name="access-time" size={12} color={Colors.brownMedium} />
              <Text style={styles.badgeText}>{timeLabel}</Text>
            </View>
          )}
          {recipe.avg_rating !== undefined && recipe.avg_rating > 0 && (
            <View style={styles.badge}>
              <MaterialIcons name="star" size={12} color={Colors.warning} />
              <Text style={styles.badgeText}>{recipe.avg_rating.toFixed(1)}</Text>
            </View>
          )}
          {!recipe.is_public && sharedGroupNames && sharedGroupNames.length > 0 && (
            <View style={styles.badge}>
              <MaterialIcons name="group" size={12} color={Colors.greenAccent} />
              <Text style={[styles.badgeText, { color: Colors.greenAccent }]} numberOfLines={1}>
                {sharedGroupNames.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardList: {
    flexDirection: 'row',
  },
  cardGrid: {
    flex: 1,
    flexDirection: 'column',
  },
  cardPressed: {
    opacity: 0.85,
  },
  imageContainerList: {
    width: 120,
    position: 'relative',
  },
  imageContainerGrid: {
    width: '100%',
    position: 'relative',
  },
  imageList: {
    width: 120,
    height: 140,
  },
  imageGrid: {
    width: '100%',
    height: 120,
  },
  imagePlaceholderList: {
    width: 120,
    height: 140,
    backgroundColor: Colors.bone,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderGrid: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.bone,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privateBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
  },
  contentList: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  contentGrid: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  titleList: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  titleGrid: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semiBold,
    color: Colors.greenAccent,
  },
  authorName: {
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.tag,
    backgroundColor: Colors.cream,
  },
  badgeText: {
    fontSize: FontSize.small,
    color: Colors.brownMedium,
    fontWeight: FontWeight.medium,
  },
});
