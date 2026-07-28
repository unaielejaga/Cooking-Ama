let editingRecipeId: string | null = null;

export function setEditingRecipeId(id: string | null) {
  editingRecipeId = id;
}

export function getEditingRecipeId(): string | null {
  const id = editingRecipeId;
  return id;
}

export function clearEditingRecipeId() {
  editingRecipeId = null;
}
