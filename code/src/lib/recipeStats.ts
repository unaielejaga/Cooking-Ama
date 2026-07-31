import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/types';

export async function hydrateRecipeStats(recipes: Recipe[]): Promise<Recipe[]> {
  if (recipes.length === 0) return recipes;

  const recipeIds = recipes.map(r => r.id);

  const [ratingsResult, replResult] = await Promise.all([
    supabase
      .from('recipe_replications')
      .select('recipe_id, rating')
      .in('recipe_id', recipeIds)
      .not('rating', 'is', null),
    supabase
      .from('recipe_replications')
      .select('recipe_id')
      .in('recipe_id', recipeIds),
  ]);

  const ratingMap = new Map<string, { sum: number; count: number }>();
  const replCountMap = new Map<string, number>();

  for (const r of ratingsResult.data || []) {
    const entry = ratingMap.get(r.recipe_id) || { sum: 0, count: 0 };
    entry.sum += r.rating || 0;
    entry.count += 1;
    ratingMap.set(r.recipe_id, entry);
  }

  for (const r of replResult.data || []) {
    replCountMap.set(r.recipe_id, (replCountMap.get(r.recipe_id) || 0) + 1);
  }

  for (const recipe of recipes) {
    const ratingEntry = ratingMap.get(recipe.id);
    if (ratingEntry && ratingEntry.count > 0) {
      recipe.avg_rating = ratingEntry.sum / ratingEntry.count;
    }
    recipe.replication_count = replCountMap.get(recipe.id) || 0;
  }

  return recipes;
}
