import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePickerExpo from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';

interface ImagePickerProps {
  imageUri: string | null;
  onImagePicked: (uri: string) => void;
  onRemove: () => void;
  loading?: boolean;
}

export function ImagePicker({ imageUri, onImagePicked, onRemove, loading }: ImagePickerProps) {
  async function pickFromGallery() {
    const result = await ImagePickerExpo.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagePicked(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePickerExpo.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePickerExpo.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagePicked(result.assets[0].uri);
    }
  }

  if (imageUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.preview} />
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <MaterialIcons name="close" size={20} color={Colors.white} />
        </Pressable>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.loadingText}>Subiendo imagen...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.buttonGroup}>
      <Pressable style={styles.pickButton} onPress={pickFromGallery}>
        <MaterialIcons name="photo-library" size={24} color={Colors.greenAccent} />
        <Text style={styles.pickButtonText}>Galería</Text>
      </Pressable>
      <Pressable style={styles.pickButton} onPress={takePhoto}>
        <MaterialIcons name="camera-alt" size={24} color={Colors.greenAccent} />
        <Text style={styles.pickButtonText}>Cámara</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.white,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  pickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
  },
  pickButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.greenAccent,
  },
});
