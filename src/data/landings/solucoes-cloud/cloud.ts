// Opções do simulador de Cloud. Todas vêm do configurador publicado pela MSSERVER em
// https://msserver.com.br/solucoes-cloud-msserver/ ("Monte a configuração ideal para sua
// empresa"), etapas Processador, Memória, Armazenamento e IP, consultado em 28/10/2026.
// A MSSERVER não publica preços de Cloud: o simulador não calcula valores.

export interface CloudCpu {
  id: string;
  cores: number;
  threads: number;
}

/** Processador: "2 Cores - 4 Threads" … "22 Cores - 44 Threads". */
export const CLOUD_CPUS: CloudCpu[] = [2, 4, 8, 10, 12, 16, 18, 20, 22].map((cores) => ({ id: `c${cores}`, cores, threads: cores * 2 }));

/** Memória: 8, 16, 32, 48 e 64 GB, além de "OUTRO". */
export const CLOUD_MEMORY_GB = [8, 16, 32, 48, 64] as const;

/** Armazenamento: 300 GB a 2 TB, além de "OUTRO". Valores em GB. */
export const CLOUD_STORAGE_GB = [300, 600, 900, 1200, 1500, 2000] as const;

/** IP: de 1 a 6. */
export const CLOUD_IPS = [1, 2, 3, 4, 5, 6] as const;

/** Limites para os campos "Outro" (validação de digitação, não oferta comercial). */
export const CUSTOM_LIMITS = {
  memoryGb: { min: 1, max: 4096 },
  storageGb: { min: 10, max: 1_000_000 },
} as const;

export const storageLabel = (gb: number) => (gb >= 1000 ? `${(gb / 1000).toLocaleString('pt-BR')} TB` : `${gb} GB`);
