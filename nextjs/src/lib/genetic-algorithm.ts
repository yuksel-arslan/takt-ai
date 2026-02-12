// ---------------------------------------------------------------------------
// Takt-Time Genetic Algorithm – TypeScript port
// Ported from: backend/app/genetic_algorithm.py
// ---------------------------------------------------------------------------

// ── Labour costs (TL / person / day) ─────────────────────────────────────────

const LABOR_COSTS: Record<string, number> = {
  "Elektrik Tesisati": 850,
  "Siva": 650,
  Boya: 600,
  Seramik: 750,
  "Asma Tavan": 700,
  "Duvar Sivasi": 650,
  Sap: 600,
  "Betonarme Kalibi": 800,
  "Mekanik Tesisat": 900,
  "Celik Dograma": 950,
};

const DEFAULT_LABOR_COST = 700;

// ── Fitness weights ──────────────────────────────────────────────────────────

const WEIGHT_DURATION = 0.35;
const WEIGHT_COST = 0.30;
const WEIGHT_BALANCE = 0.20;
const WEIGHT_RISK = 0.15;

// ── Normalisation constants ──────────────────────────────────────────────────

const MAX_DURATION = 365;
const MAX_COST = 8_000_000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface TaktConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  tournamentSize: number;
  elitismCount: number;
}

export interface Zon {
  id: string;
  kat_no: number;
  alan: number;
  is_yogunlugu: number;
}

export interface Ekip {
  id: string | number;
  isim: string;
  kisi_sayisi: number;
  verimlilik: number;
}

export interface Chromosome {
  zonlar: Zon[];
  ekipler: Ekip[];
  takt_suresi: number;
  fitness: number;
  duration: number;
  cost: number;
  resource_balance: number;
  risk: number;
  /** Only present on scenario chromosomes */
  name?: string;
  /** Only present on scenario chromosomes */
  description?: string;
}

export interface Kat {
  kat_adi: string;
  kat_no: number;
}

export interface IsKalemi {
  id: string | number;
  isim: string;
}

export interface ProjectData {
  katlar?: Kat[];
  is_kalemleri?: IsKalemi[];
  [key: string]: unknown;
}

export interface EvolutionHistory {
  best_fitness: number[];
  avg_fitness: number[];
}

export interface OptimizeStatistics {
  total_generations: number;
  population_size: number;
  best_fitness: number;
  best_duration: number;
  best_cost: number;
}

export interface OptimizeResult {
  best_plan: Chromosome;
  scenarios: Chromosome[];
  evolution_history: EvolutionHistory;
  statistics: OptimizeStatistics;
}

// ── Helpers (replaces numpy usage) ───────────────────────────────────────────

function randInt(min: number, max: number): number {
  // inclusive on both ends, like Python random.randint
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function sample<T>(arr: T[], n: number): T[] {
  // Fisher-Yates partial shuffle to pick n unique elements
  const copy = arr.slice();
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy[idx] = copy[copy.length - 1];
    copy.pop();
  }
  return result;
}

function choice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Shallow-clone a chromosome (deep-clones nested arrays of plain objects). */
function cloneChromosome(ch: Chromosome): Chromosome {
  return {
    ...ch,
    zonlar: ch.zonlar.map((z) => ({ ...z })),
    ekipler: ch.ekipler.map((e) => ({ ...e })),
  };
}

// ── Default config ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG: TaktConfig = {
  populationSize: 150,
  generations: 80,
  mutationRate: 0.12,
  crossoverRate: 0.85,
  tournamentSize: 4,
  elitismCount: 2,
};

// ── Genetic Algorithm ────────────────────────────────────────────────────────

export class TaktGeneticAlgorithm {
  private project: ProjectData;
  private config: TaktConfig;
  private population: Chromosome[] = [];
  private bestChromosome: Chromosome | null = null;
  private bestFitnessHistory: number[] = [];
  private avgFitnessHistory: number[] = [];

  constructor(projectData: ProjectData, config?: Partial<TaktConfig>) {
    this.project = projectData;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Chromosome creation ──────────────────────────────────────────────────

  private createChromosome(): Chromosome {
    const katlar: Kat[] = this.project.katlar ?? [];
    const isKalemleri: IsKalemi[] = this.project.is_kalemleri ?? [];

    const zonlar: Zon[] = [];
    for (const kat of katlar) {
      const zonSayisi = randInt(2, 4);
      for (let i = 0; i < zonSayisi; i++) {
        zonlar.push({
          id: `${kat.kat_adi}-${String.fromCharCode(65 + i)}`,
          kat_no: kat.kat_no,
          alan: randInt(80, 180),
          is_yogunlugu: roundTo(randFloat(0.8, 1.2), 2),
        });
      }
    }

    const ekipler: Ekip[] = isKalemleri.map((ik) => ({
      id: ik.id,
      isim: ik.isim,
      kisi_sayisi: randInt(3, 8),
      verimlilik: roundTo(randFloat(0.9, 1.1), 2),
    }));

    return {
      zonlar,
      ekipler,
      takt_suresi: randInt(5, 14),
      fitness: 0,
      duration: 0,
      cost: 0,
      resource_balance: 0,
      risk: 0,
    };
  }

  // ── Fitness calculations ─────────────────────────────────────────────────

  private static calcDuration(ch: Chromosome): number {
    const zonCount = ch.zonlar.length;
    const ekipCount = ch.ekipler.length;
    return (ekipCount + zonCount - 1) * ch.takt_suresi;
  }

  private static calcCost(ch: Chromosome): number {
    const duration = TaktGeneticAlgorithm.calcDuration(ch);
    let total = 0;
    for (const ekip of ch.ekipler) {
      const daily = LABOR_COSTS[ekip.isim] ?? DEFAULT_LABOR_COST;
      total += daily * ekip.kisi_sayisi * duration;
    }
    return total;
  }

  private static calcResourceBalance(ch: Chromosome): number {
    const sizes = ch.ekipler.map((e) => e.kisi_sayisi);
    if (sizes.length === 0) return 0.5;
    const sd = stdDev(sizes);
    return Math.min(1.0, 1.0 / (1.0 + sd));
  }

  private static calcRisk(ch: Chromosome): number {
    const takt = ch.takt_suresi;
    const zonCount = ch.zonlar.length;
    const ekipler = ch.ekipler;

    const taktRisk = Math.abs(takt - 9) / 10;
    const zonRisk = zonCount / 30;
    const avgTeam =
      ekipler.length > 0
        ? mean(ekipler.map((e) => e.kisi_sayisi))
        : 5.0;
    const ekipRisk = Math.abs(avgTeam - 5) / 10;

    return Math.min(1.0, taktRisk * 0.4 + zonRisk * 0.3 + ekipRisk * 0.3);
  }

  private evaluate(ch: Chromosome): number {
    const duration = TaktGeneticAlgorithm.calcDuration(ch);
    const cost = TaktGeneticAlgorithm.calcCost(ch);
    const balance = TaktGeneticAlgorithm.calcResourceBalance(ch);
    const risk = TaktGeneticAlgorithm.calcRisk(ch);

    const normDur = 1 - duration / MAX_DURATION;
    const normCost = 1 - cost / MAX_COST;

    const fitness =
      normDur * WEIGHT_DURATION +
      normCost * WEIGHT_COST +
      balance * WEIGHT_BALANCE +
      (1 - risk) * WEIGHT_RISK;

    ch.fitness = fitness;
    ch.duration = duration;
    ch.cost = cost;
    ch.resource_balance = balance;
    ch.risk = risk;

    return fitness;
  }

  // ── Genetic operators ────────────────────────────────────────────────────

  private tournamentSelect(): Chromosome {
    const candidates = sample(this.population, this.config.tournamentSize);
    return candidates.reduce((best, c) =>
      c.fitness > best.fitness ? c : best,
    );
  }

  private crossover(p1: Chromosome, p2: Chromosome): [Chromosome, Chromosome] {
    if (Math.random() > this.config.crossoverRate) {
      return [cloneChromosome(p1), cloneChromosome(p2)];
    }

    const c1 = cloneChromosome(p1);
    const c2 = cloneChromosome(p2);

    // Zone crossover
    const minLen = Math.min(p1.zonlar.length, p2.zonlar.length);
    if (minLen > 0) {
      const xp = randInt(0, minLen - 1);
      for (let i = xp; i < c1.zonlar.length; i++) {
        if (i < p2.zonlar.length) {
          c1.zonlar[i] = { ...p2.zonlar[i] };
        }
      }
      for (let i = xp; i < c2.zonlar.length; i++) {
        if (i < p1.zonlar.length) {
          c2.zonlar[i] = { ...p1.zonlar[i] };
        }
      }
    }

    // Team crossover
    for (let i = 0; i < c1.ekipler.length; i++) {
      if (i < p2.ekipler.length && Math.random() > 0.5) {
        c1.ekipler[i].kisi_sayisi = p2.ekipler[i].kisi_sayisi;
      }
    }
    for (let i = 0; i < c2.ekipler.length; i++) {
      if (i < p1.ekipler.length && Math.random() > 0.5) {
        c2.ekipler[i].kisi_sayisi = p1.ekipler[i].kisi_sayisi;
      }
    }

    // Takt time crossover
    if (Math.random() > 0.5) {
      const tmp = c1.takt_suresi;
      c1.takt_suresi = c2.takt_suresi;
      c2.takt_suresi = tmp;
    }

    return [c1, c2];
  }

  private mutate(chromosome: Chromosome): Chromosome {
    const m = cloneChromosome(chromosome);
    const rate = this.config.mutationRate;

    // Zone area mutation
    if (Math.random() < rate) {
      for (const zon of m.zonlar) {
        if (Math.random() < 0.3) {
          zon.alan = Math.max(
            50,
            Math.min(250, Math.round(zon.alan * randFloat(0.8, 1.2))),
          );
        }
      }
    }

    // Team size mutation
    if (Math.random() < rate) {
      for (const ekip of m.ekipler) {
        if (Math.random() < 0.2) {
          ekip.kisi_sayisi = Math.max(
            2,
            Math.min(12, ekip.kisi_sayisi + choice([-1, 0, 1])),
          );
        }
      }
    }

    // Takt time mutation
    if (Math.random() < rate) {
      m.takt_suresi = Math.max(
        3,
        Math.min(20, m.takt_suresi + choice([-1, 0, 1])),
      );
    }

    return m;
  }

  // ── Evolution ────────────────────────────────────────────────────────────

  private initPopulation(): void {
    this.population = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      const ch = this.createChromosome();
      this.evaluate(ch);
      this.population.push(ch);
    }
    this.population.sort((a, b) => b.fitness - a.fitness);
    this.bestChromosome = cloneChromosome(this.population[0]);
  }

  private evolveGeneration(): void {
    const newPop: Chromosome[] = [];

    // Elitism
    const eliteCount = Math.min(
      this.config.elitismCount,
      this.population.length,
    );
    for (let i = 0; i < eliteCount; i++) {
      newPop.push(cloneChromosome(this.population[i]));
    }

    // Fill with offspring
    while (newPop.length < this.config.populationSize) {
      const p1 = this.tournamentSelect();
      const p2 = this.tournamentSelect();
      const [c1, c2] = this.crossover(p1, p2);
      for (const child of [c1, c2]) {
        const mutated = this.mutate(child);
        this.evaluate(mutated);
        newPop.push(mutated);
        if (newPop.length >= this.config.populationSize) break;
      }
    }

    this.population = newPop.slice(0, this.config.populationSize);
    this.population.sort((a, b) => b.fitness - a.fitness);

    if (this.population[0].fitness > this.bestChromosome!.fitness) {
      this.bestChromosome = cloneChromosome(this.population[0]);
    }

    this.bestFitnessHistory.push(this.population[0].fitness);
    const avg =
      this.population.reduce((s, c) => s + c.fitness, 0) /
      this.population.length;
    this.avgFitnessHistory.push(avg);
  }

  // ── Scenarios ────────────────────────────────────────────────────────────

  private generateScenarios(): Chromosome[] {
    const best = this.bestChromosome!;
    const scenarios: Chromosome[] = [];

    // Fast track – Hizli Tren
    const fast = cloneChromosome(best);
    fast.takt_suresi = Math.max(3, fast.takt_suresi - 2);
    for (const ekip of fast.ekipler) {
      ekip.kisi_sayisi += 2;
    }
    this.evaluate(fast);
    fast.name = "Hizli Tren";
    fast.description = "Minimum sure, yuksek iscilik maliyeti";
    scenarios.push(fast);

    // Economic – Ekonomik
    const eco = cloneChromosome(best);
    eco.takt_suresi = Math.min(20, eco.takt_suresi + 2);
    for (const ekip of eco.ekipler) {
      ekip.kisi_sayisi = Math.max(2, ekip.kisi_sayisi - 1);
    }
    this.evaluate(eco);
    eco.name = "Ekonomik";
    eco.description = "Minimum maliyet, uzun proje suresi";
    scenarios.push(eco);

    // Balanced – Dengeli
    const balanced = cloneChromosome(best);
    this.evaluate(balanced);
    balanced.name = "Dengeli (Onerilen)";
    balanced.description = "Sure-maliyet-risk dengesi optimum";
    scenarios.push(balanced);

    return scenarios;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  optimize(): OptimizeResult {
    this.initPopulation();

    for (let gen = 0; gen < this.config.generations; gen++) {
      this.evolveGeneration();
      if (gen % 20 === 0) {
        console.log(
          `Generation ${gen}: Best Fitness = ${this.bestChromosome!.fitness.toFixed(4)}`,
        );
      }
    }

    const scenarios = this.generateScenarios();

    return {
      best_plan: this.bestChromosome!,
      scenarios,
      evolution_history: {
        best_fitness: this.bestFitnessHistory,
        avg_fitness: this.avgFitnessHistory,
      },
      statistics: {
        total_generations: this.config.generations,
        population_size: this.config.populationSize,
        best_fitness: this.bestChromosome!.fitness,
        best_duration: this.bestChromosome!.duration,
        best_cost: this.bestChromosome!.cost,
      },
    };
  }
}
