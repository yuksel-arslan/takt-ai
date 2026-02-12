import logging
import random
from dataclasses import dataclass, field
from typing import Any, Dict, List

import numpy as np

logger = logging.getLogger(__name__)

# Günlük işçilik maliyetleri (TL/kişi/gün)
LABOR_COSTS: Dict[str, int] = {
    "Elektrik Tesisatı": 850,
    "Sıva": 650,
    "Boya": 600,
    "Seramik": 750,
    "Asma Tavan": 700,
    "Duvar Sıvası": 650,
    "Şap": 600,
    "Betonarme Kalıbı": 800,
    "Mekanik Tesisat": 900,
    "Çelik Doğrama": 950,
}
DEFAULT_LABOR_COST = 700

# Fitness ağırlıkları
WEIGHT_DURATION = 0.35
WEIGHT_COST = 0.30
WEIGHT_BALANCE = 0.20
WEIGHT_RISK = 0.15

# Normalizasyon sabitleri
MAX_DURATION = 365
MAX_COST = 8_000_000


@dataclass
class TaktConfig:
    population_size: int = 150
    generations: int = 80
    mutation_rate: float = 0.12
    crossover_rate: float = 0.85
    tournament_size: int = 4
    elitism_count: int = 2


class TaktGeneticAlgorithm:
    def __init__(
        self, project_data: Dict[str, Any], config: TaktConfig | None = None
    ) -> None:
        self.project = project_data
        self.config = config or TaktConfig()
        self.population: List[Dict[str, Any]] = []
        self.best_chromosome: Dict[str, Any] | None = None
        self.best_fitness_history: List[float] = []
        self.avg_fitness_history: List[float] = []

    # ── Chromosome creation ──────────────────────────────────

    def _create_chromosome(self) -> Dict[str, Any]:
        katlar = self.project.get("katlar", [])
        is_kalemleri = self.project.get("is_kalemleri", [])

        zonlar = []
        for kat in katlar:
            zon_sayisi = random.randint(2, 4)
            for i in range(zon_sayisi):
                zonlar.append(
                    {
                        "id": f"{kat['kat_adi']}-{chr(65 + i)}",
                        "kat_no": kat["kat_no"],
                        "alan": random.randint(80, 180),
                        "is_yoğunluğu": round(random.uniform(0.8, 1.2), 2),
                    }
                )

        ekipler = [
            {
                "id": ik["id"],
                "isim": ik["isim"],
                "kisi_sayisi": random.randint(3, 8),
                "verimlilik": round(random.uniform(0.9, 1.1), 2),
            }
            for ik in is_kalemleri
        ]

        return {
            "zonlar": zonlar,
            "ekipler": ekipler,
            "takt_suresi": random.randint(5, 14),
            "fitness": 0.0,
            "duration": 0,
            "cost": 0.0,
            "resource_balance": 0.0,
            "risk": 0.0,
        }

    # ── Fitness calculations ─────────────────────────────────

    @staticmethod
    def _calc_duration(chromosome: Dict[str, Any]) -> int:
        zon_count = len(chromosome["zonlar"])
        ekip_count = len(chromosome["ekipler"])
        takt = chromosome["takt_suresi"]
        return (ekip_count + zon_count - 1) * takt

    def _calc_cost(self, chromosome: Dict[str, Any]) -> float:
        duration = self._calc_duration(chromosome)
        total = 0.0
        for ekip in chromosome["ekipler"]:
            daily = LABOR_COSTS.get(ekip["isim"], DEFAULT_LABOR_COST)
            total += daily * ekip["kisi_sayisi"] * duration
        return total

    @staticmethod
    def _calc_resource_balance(chromosome: Dict[str, Any]) -> float:
        sizes = [e["kisi_sayisi"] for e in chromosome["ekipler"]]
        if not sizes:
            return 0.5
        std = float(np.std(sizes)) if len(sizes) > 1 else 0.0
        return min(1.0, 1.0 / (1.0 + std))

    @staticmethod
    def _calc_risk(chromosome: Dict[str, Any]) -> float:
        takt = chromosome["takt_suresi"]
        zon_count = len(chromosome["zonlar"])
        ekipler = chromosome["ekipler"]

        takt_risk = abs(takt - 9) / 10
        zon_risk = zon_count / 30
        avg_team = float(np.mean([e["kisi_sayisi"] for e in ekipler])) if ekipler else 5.0
        ekip_risk = abs(avg_team - 5) / 10

        return min(1.0, takt_risk * 0.4 + zon_risk * 0.3 + ekip_risk * 0.3)

    def _evaluate(self, chromosome: Dict[str, Any]) -> float:
        duration = self._calc_duration(chromosome)
        cost = self._calc_cost(chromosome)
        balance = self._calc_resource_balance(chromosome)
        risk = self._calc_risk(chromosome)

        norm_dur = 1 - (duration / MAX_DURATION)
        norm_cost = 1 - (cost / MAX_COST)

        fitness = (
            norm_dur * WEIGHT_DURATION
            + norm_cost * WEIGHT_COST
            + balance * WEIGHT_BALANCE
            + (1 - risk) * WEIGHT_RISK
        )

        chromosome.update(
            {
                "fitness": fitness,
                "duration": duration,
                "cost": cost,
                "resource_balance": balance,
                "risk": risk,
            }
        )
        return fitness

    # ── Genetic operators ────────────────────────────────────

    def _tournament_select(self) -> Dict[str, Any]:
        candidates = random.sample(self.population, self.config.tournament_size)
        return max(candidates, key=lambda c: c["fitness"])

    def _crossover(
        self, p1: Dict[str, Any], p2: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        if random.random() > self.config.crossover_rate:
            return [p1.copy(), p2.copy()]

        c1, c2 = p1.copy(), p2.copy()

        # Zone crossover
        min_len = min(len(p1["zonlar"]), len(p2["zonlar"]))
        if min_len > 0:
            xp = random.randint(0, min_len - 1)
            for i in range(xp, len(c1["zonlar"])):
                if i < len(p2["zonlar"]):
                    c1["zonlar"][i] = p2["zonlar"][i].copy()
            for i in range(xp, len(c2["zonlar"])):
                if i < len(p1["zonlar"]):
                    c2["zonlar"][i] = p1["zonlar"][i].copy()

        # Team crossover
        for i in range(len(c1["ekipler"])):
            if i < len(p2["ekipler"]) and random.random() > 0.5:
                c1["ekipler"][i]["kisi_sayisi"] = p2["ekipler"][i]["kisi_sayisi"]
        for i in range(len(c2["ekipler"])):
            if i < len(p1["ekipler"]) and random.random() > 0.5:
                c2["ekipler"][i]["kisi_sayisi"] = p1["ekipler"][i]["kisi_sayisi"]

        # Takt time crossover
        if random.random() > 0.5:
            c1["takt_suresi"], c2["takt_suresi"] = c2["takt_suresi"], c1["takt_suresi"]

        return [c1, c2]

    def _mutate(self, chromosome: Dict[str, Any]) -> Dict[str, Any]:
        m = chromosome.copy()
        rate = self.config.mutation_rate

        if random.random() < rate:
            for zon in m["zonlar"]:
                if random.random() < 0.3:
                    zon["alan"] = max(50, min(250, int(zon["alan"] * random.uniform(0.8, 1.2))))

        if random.random() < rate:
            for ekip in m["ekipler"]:
                if random.random() < 0.2:
                    ekip["kisi_sayisi"] = max(
                        2, min(12, ekip["kisi_sayisi"] + random.choice([-1, 0, 1]))
                    )

        if random.random() < rate:
            m["takt_suresi"] = max(
                3, min(20, m["takt_suresi"] + random.choice([-1, 0, 1]))
            )

        return m

    # ── Evolution ────────────────────────────────────────────

    def _init_population(self) -> None:
        self.population = []
        for _ in range(self.config.population_size):
            ch = self._create_chromosome()
            self._evaluate(ch)
            self.population.append(ch)
        self.population.sort(key=lambda c: c["fitness"], reverse=True)
        self.best_chromosome = self.population[0].copy()

    def _evolve_generation(self) -> None:
        new_pop: List[Dict[str, Any]] = []

        # Elitism
        for i in range(min(self.config.elitism_count, len(self.population))):
            new_pop.append(self.population[i].copy())

        while len(new_pop) < self.config.population_size:
            p1 = self._tournament_select()
            p2 = self._tournament_select()
            children = self._crossover(p1, p2)
            for child in children:
                mutated = self._mutate(child)
                self._evaluate(mutated)
                new_pop.append(mutated)
                if len(new_pop) >= self.config.population_size:
                    break

        self.population = new_pop[: self.config.population_size]
        self.population.sort(key=lambda c: c["fitness"], reverse=True)

        if self.population[0]["fitness"] > self.best_chromosome["fitness"]:
            self.best_chromosome = self.population[0].copy()

        self.best_fitness_history.append(self.population[0]["fitness"])
        avg = sum(c["fitness"] for c in self.population) / len(self.population)
        self.avg_fitness_history.append(avg)

    # ── Scenarios ────────────────────────────────────────────

    def _generate_scenarios(self) -> List[Dict[str, Any]]:
        best = self.best_chromosome
        scenarios: List[Dict[str, Any]] = []

        # Fast track
        fast = best.copy()
        fast["zonlar"] = [z.copy() for z in best["zonlar"]]
        fast["ekipler"] = [e.copy() for e in best["ekipler"]]
        fast["takt_suresi"] = max(3, fast["takt_suresi"] - 2)
        for ekip in fast["ekipler"]:
            ekip["kisi_sayisi"] += 2
        self._evaluate(fast)
        fast["name"] = "Hizli Tren"
        fast["description"] = "Minimum sure, yuksek iscilik maliyeti"
        scenarios.append(fast)

        # Economic
        eco = best.copy()
        eco["zonlar"] = [z.copy() for z in best["zonlar"]]
        eco["ekipler"] = [e.copy() for e in best["ekipler"]]
        eco["takt_suresi"] = min(20, eco["takt_suresi"] + 2)
        for ekip in eco["ekipler"]:
            ekip["kisi_sayisi"] = max(2, ekip["kisi_sayisi"] - 1)
        self._evaluate(eco)
        eco["name"] = "Ekonomik"
        eco["description"] = "Minimum maliyet, uzun proje suresi"
        scenarios.append(eco)

        # Balanced
        balanced = best.copy()
        balanced["zonlar"] = [z.copy() for z in best["zonlar"]]
        balanced["ekipler"] = [e.copy() for e in best["ekipler"]]
        self._evaluate(balanced)
        balanced["name"] = "Dengeli (Onerilen)"
        balanced["description"] = "Sure-maliyet-risk dengesi optimum"
        scenarios.append(balanced)

        return scenarios

    # ── Public API ───────────────────────────────────────────

    def optimize(self) -> Dict[str, Any]:
        self._init_population()

        for gen in range(self.config.generations):
            self._evolve_generation()
            if gen % 20 == 0:
                logger.info(
                    "Generation %d: Best Fitness = %.4f",
                    gen,
                    self.best_chromosome["fitness"],
                )

        scenarios = self._generate_scenarios()

        return {
            "best_plan": self.best_chromosome,
            "scenarios": scenarios,
            "evolution_history": {
                "best_fitness": self.best_fitness_history,
                "avg_fitness": self.avg_fitness_history,
            },
            "statistics": {
                "total_generations": self.config.generations,
                "population_size": self.config.population_size,
                "best_fitness": self.best_chromosome["fitness"],
                "best_duration": self.best_chromosome["duration"],
                "best_cost": self.best_chromosome["cost"],
            },
        }
