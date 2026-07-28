import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { Profile } from '@/lib/types';

interface UserSelectorProps {
  selectedIds: string[];
  onToggle: (userId: string) => void;
  excludeIds?: string[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserSelector({ selectedIds, onToggle, excludeIds }: UserSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);

    try {
      let q = supabase
        .from('profiles')
        .select('*')
        .limit(10);

      if (excludeIds && excludeIds.length > 0) {
        q = q.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await q.or(
        `username.ilike.%${text}%,display_name.ilike.%${text}%`
      );

      if (error) throw error;
      setResults((data || []).filter(p => !selectedIds.includes(p.id)));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [selectedIds, excludeIds]);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(text), 300);
  }, [searchUsers]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <MaterialIcons name="search" size={20} color={Colors.brownLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          placeholderTextColor={Colors.brownLight}
          value={query}
          onChangeText={handleChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching && <MaterialIcons name="hourglass-empty" size={18} color={Colors.brownLight} />}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const displayName = item.display_name || item.username;
              return (
                <Pressable
                  style={styles.resultRow}
                  onPress={() => onToggle(item.id)}
                >
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                    </View>
                  )}
                  <Text style={styles.resultName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.resultUsername}>@{item.username}</Text>
                </Pressable>
              );
            }}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}

      {selectedIds.length > 0 && (
        <Text style={styles.selectedLabel}>
          {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    padding: 0,
    height: 44,
  },
  resultsContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
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
  resultName: {
    flex: 1,
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownDark,
  },
  resultUsername: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  selectedLabel: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
    textAlign: 'center',
  },
});
