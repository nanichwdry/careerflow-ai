import type { Job, JobSearchFilters } from '@/types/jobs';
import type { SourceConnector } from '@/types/automation';

export interface JobProvider {
  connector: SourceConnector;
  search(filters: JobSearchFilters): Promise<Job[]>;
  getJob(id: string): Promise<Job | null>;
  canApply(): boolean;
}

// Registry pattern — register real providers here when integrations are built
const providerRegistry = new Map<string, JobProvider>();

export function registerProvider(id: string, provider: JobProvider) {
  providerRegistry.set(id, provider);
}

export function getProvider(id: string): JobProvider | undefined {
  return providerRegistry.get(id);
}

export function getActiveProviders(): JobProvider[] {
  return Array.from(providerRegistry.values()).filter(p => p.connector.enabled);
}

export async function searchAllProviders(filters: JobSearchFilters): Promise<Job[]> {
  const providers = getActiveProviders();
  if (providers.length === 0) return [];
  const results = await Promise.allSettled(providers.map(p => p.search(filters)));
  return results
    .filter((r): r is PromiseFulfilledResult<Job[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);
}
