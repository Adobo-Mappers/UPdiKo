import { useQuery } from '@tanstack/react-query';
import { createUnifiedLocations } from '../services/locationAdapter.js';
import { getStaticLocations } from '../services/locations.js';
import { getPinnedLocationsFromDB, supabase } from '../services/supabase.js';

/**
 * Loads public OSM-backed locations with TanStack Query caching.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<Record<string, any>>>}
 */
export function usePublicLocations() {
  return useQuery({
    queryKey: ['public-locations'],
    queryFn: () => getStaticLocations(supabase),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Loads the signed-in user's personal pins.
 *
 * @param {string | null | undefined} userId
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<Record<string, any>>>}
 */
export function useUserLocations(userId) {
  return useQuery({
    queryKey: ['user-locations', userId],
    queryFn: () => getPinnedLocationsFromDB(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
  });
}

/**
 * Returns the split and unified location datasets used across home, map, and search.
 *
 * @param {string | null | undefined} userId
 * @returns {{
 *   publicLocations: Array<Record<string, any>>,
 *   userLocations: Array<Record<string, any>>,
 *   unifiedLocations: import('../services/locationAdapter.js').UnifiedLocation[],
 *   isLoading: boolean,
 *   error: Error | null
 * }}
 */
export function useUnifiedLocations(userId) {
  const publicQuery = usePublicLocations();
  const userQuery = useUserLocations(userId);

  const publicLocations = publicQuery.data || [];
  const userLocations = userQuery.data || [];

  return {
    publicLocations,
    userLocations,
    unifiedLocations: createUnifiedLocations(publicLocations, userLocations),
    isLoading: publicQuery.isLoading || (Boolean(userId) && userQuery.isLoading),
    error: publicQuery.error || userQuery.error || null,
  };
}
