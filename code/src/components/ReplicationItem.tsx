import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RatingStars } from '@/components/RatingStars';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { getReplicationImageUrl } from '@/lib/supabase';
import { Replication, ReplicationReaction } from '@/lib/types';

const EMOJIS = ['❤️', '🔥', '👏', '😍', '🎉', '💪'];

interface ReplicationItemProps {
  replication: Replication;
  onImagePress?: (url: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
  reactions?: ReplicationReaction[];
  canReact?: boolean;
  currentUserId?: string;
  onReact?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months}mes`;
}

function groupReactions(reactions: ReplicationReaction[] = []): { emoji: string; count: number; hasMine: boolean }[] {
  const map = new Map<string, { count: number; hasMine: boolean }>();
  for (const r of reactions) {
    const entry = map.get(r.emoji) || { count: 0, hasMine: false };
    entry.count++;
    map.set(r.emoji, entry);
  }
  return Array.from(map.entries()).map(([emoji, data]) => ({ emoji, ...data }));
}

export function ReplicationItem({ replication, onImagePress, onEdit, onDelete, isOwner, reactions = [], canReact, currentUserId, onReact, onRemoveReaction }: ReplicationItemProps) {
  const [showPicker, setShowPicker] = useState(false);
  const user = replication.user;
  const userName = user?.display_name || user?.username || '';
  const grouped = groupReactions(reactions);
  const myEmojis = new Set(reactions.filter(r => r.user_id === currentUserId).map(r => r.emoji));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{getInitials(userName)}</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.date}>{formatRelativeTime(replication.created_at)}</Text>
        </View>
        {replication.rating && (
          <RatingStars rating={replication.rating} readonly size={16} />
        )}
        {isOwner && (
          <View style={styles.ownerActions}>
            {onEdit && (
              <Pressable onPress={onEdit} hitSlop={8} style={styles.actionButton}>
                <MaterialIcons name="edit" size={18} color={Colors.brownLight} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={onDelete} hitSlop={8} style={styles.actionButton}>
                <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {replication.image_url && (
        <Pressable onPress={() => onImagePress?.(replication.image_url!)}>
          <Image
            source={{ uri: getReplicationImageUrl(replication.image_url) ?? '' }}
            style={styles.image}
          />
        </Pressable>
      )}

      {replication.comment && (
        <Text style={styles.comment}>{replication.comment}</Text>
      )}

      <View style={styles.reactionsRow}>
        {grouped.map(({ emoji, count }) => (
          <Pressable
            key={emoji}
            style={[styles.reactionPill, myEmojis.has(emoji) && styles.reactionPillActive]}
            onPress={() => {
              if (myEmojis.has(emoji)) onRemoveReaction?.(emoji);
              else onReact?.(emoji);
            }}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text style={styles.reactionCount}>{count}</Text>
          </Pressable>
        ))}
        {canReact && (
          <>
            {showPicker ? (
              <View style={styles.emojiPicker}>
                {EMOJIS.map(emoji => (
                  <Pressable
                    key={emoji}
                    style={styles.emojiOption}
                    onPress={() => { onReact?.(emoji); setShowPicker(false); }}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable style={styles.addReactionBtn} onPress={() => setShowPicker(true)}>
                <MaterialIcons name="add" size={16} color={Colors.brownLight} />
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.greenAccent,
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  date: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
  },
  comment: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    lineHeight: 22,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: 4,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.tag,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionPillActive: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenAccent,
  },
  reactionEmoji: {
    fontSize: FontSize.body,
  },
  reactionCount: {
    fontSize: FontSize.small,
    color: Colors.brownMedium,
    fontWeight: FontWeight.medium,
  },
  addReactionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPicker: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  emojiOption: {
    padding: 4,
  },
  emojiOptionText: {
    fontSize: FontSize.h3,
  },
});
