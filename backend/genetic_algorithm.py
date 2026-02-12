import numpy as np
import random
from typing import List, Dict, Any
from dataclasses import dataclass
import json

@dataclass
class TaktConfig:
    population_size: int = 150
    generations: int = 80
    mutation_rate: float = 0.12
    crossover_rate: float = 0.85
    tournament_size: int = 4
    elitism_count: int = 2

class TaktGeneticAlgorithm:
    def __init__(self, project_data: Dict[str, Any], config: TaktConfig = None):
        self.project = project_data
        self.config = config or TaktConfig()
        
        # Maliyet verileri
        self.labor_costs = {
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
            "default": 700
        }
        
        self.population = []
        self.best_chromosome = None
        self.best_fitness_history = []
        self.avg_fitness_history = []
        
    def create_chromosome(self) -> Dict[str, Any]:
        """Rastgele bir plan (kromozom) oluştur"""
        
        katlar = self.project.get("katlar", [])
        is_kalemleri = self.project.get("is_kalemleri", [])
        
        # Zonları oluştur
        zonlar = []
        for kat in katlar:
            zon_sayisi = random.randint(2, 4)
            for i in range(zon_sayisi):
                zonlar.append({
                    "id": f"{kat['kat_adi']}-{chr(65 + i)}",
                    "kat_no": kat['kat_no'],
                    "alan": random.randint(80, 180),
                    "is_yoğunluğu": random.uniform(0.8, 1.2)
                })
        
        # Ekip sayıları
        ekipler = []
        for is_kalem in is_kalemleri:
            ekipler.append({
                "id": is_kalem['id'],
                "isim": is_kalem['isim'],
                "kisi_sayisi": random.randint(3, 8),
                "verimlilik": random.uniform(0.9, 1.1)
            })
        
        # Takt süresi
        takt_suresi = random.randint(5, 14)
        
        return {
            "zonlar": zonlar,
            "ekipler": ekipler,
            "takt_suresi": takt_suresi,
            "fitness": 0,
            "duration": 0,
            "cost": 0,
            "resource_balance": 0,
            "risk": 0
        }
    
    def calculate_duration(self, chromosome: Dict[str, Any]) -> int:
        """Proje süresini hesapla"""
        zon_sayisi = len(chromosome["zonlar"])
        ekip_sayisi = len(chromosome["ekipler"])
        takt = chromosome["takt_suresi"]
        
        # Takt formülü: (Vagon + Zon - 1) x Takt
        duration = (ekip_sayisi + zon_sayisi - 1) * takt
        return duration
    
    def calculate_cost(self, chromosome: Dict[str, Any]) -> float:
        """Toplam maliyeti hesapla"""
        total_cost = 0
        duration = self.calculate_duration(chromosome)
        
        for ekip in chromosome["ekipler"]:
            gunluk_maliyet = self.labor_costs.get(ekip["isim"], self.labor_costs["default"])
            total_cost += gunluk_maliyet * ekip["kisi_sayisi"] * duration
        
        return total_cost
    
    def calculate_resource_balance(self, chromosome: Dict[str, Any]) -> float:
        """Kaynak dengesini hesapla (0-1 arası)"""
        ekip_sayilari = [e["kisi_sayisi"] for e in chromosome["ekipler"]]
        
        if not ekip_sayilari:
            return 0.5
            
        mean = np.mean(ekip_sayilari)
        std_dev = np.std(ekip_sayilari) if len(ekip_sayilari) > 1 else 0
        
        # Standart sapma ne kadar düşükse denge o kadar iyi
        balance = 1 / (1 + std_dev)
        return min(1.0, balance)
    
    def calculate_risk(self, chromosome: Dict[str, Any]) -> float:
        """Risk skorunu hesapla (0-1 arası)"""
        takt = chromosome["takt_suresi"]
        zon_sayisi = len(chromosome["zonlar"])
        
        # Takt süresi riski (5-14 gün arası ideal)
        takt_risk = abs(takt - 9) / 10
        
        # Zon sayısı riski (çok zon = yüksek risk)
        zon_risk = zon_sayisi / 30  # Maks 30 zon
        
        # Ekip büyüklüğü riski
        ortalama_ekip = np.mean([e["kisi_sayisi"] for e in chromosome["ekipler"]]) if chromosome["ekipler"] else 5
        ekip_risk = abs(ortalama_ekip - 5) / 10
        
        risk = (takt_risk * 0.4 + zon_risk * 0.3 + ekip_risk * 0.3)
        return min(1.0, risk)
    
    def calculate_fitness(self, chromosome: Dict[str, Any]) -> float:
        """Fitness değerini hesapla (0-1 arası, yüksek iyi)"""
        
        duration = self.calculate_duration(chromosome)
        cost = self.calculate_cost(chromosome)
        balance = self.calculate_resource_balance(chromosome)
        risk = self.calculate_risk(chromosome)
        
        # Normalizasyon
        max_duration = 365
        max_cost = 8000000
        
        norm_duration = 1 - (duration / max_duration)
        norm_cost = 1 - (cost / max_cost)
        
        # Ağırlıklar
        fitness = (
            norm_duration * 0.35 +
            norm_cost * 0.30 +
            balance * 0.20 +
            (1 - risk) * 0.15
        )
        
        chromosome["fitness"] = fitness
        chromosome["duration"] = duration
        chromosome["cost"] = cost
        chromosome["resource_balance"] = balance
        chromosome["risk"] = risk
        
        return fitness
    
    def tournament_selection(self) -> Dict[str, Any]:
        """Turnuva seçilimi"""
        tournament = random.sample(self.population, self.config.tournament_size)
        return max(tournament, key=lambda x: x["fitness"])
    
    def crossover(self, parent1: Dict[str, Any], parent2: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Çaprazlama"""
        if random.random() > self.config.crossover_rate:
            return [parent1.copy(), parent2.copy()]
        
        child1 = parent1.copy()
        child2 = parent2.copy()
        
        # Zon çaprazlama
        crossover_point = random.randint(0, min(len(parent1["zonlar"]), len(parent2["zonlar"])) - 1)
        
        for i in range(crossover_point, len(child1["zonlar"])):
            if i < len(parent2["zonlar"]):
                child1["zonlar"][i] = parent2["zonlar"][i].copy()
        
        for i in range(crossover_point, len(child2["zonlar"])):
            if i < len(parent1["zonlar"]):
                child2["zonlar"][i] = parent1["zonlar"][i].copy()
        
        # Ekip çaprazlama
        for i in range(len(child1["ekipler"])):
            if i < len(parent2["ekipler"]) and random.random() > 0.5:
                child1["ekipler"][i]["kisi_sayisi"] = parent2["ekipler"][i]["kisi_sayisi"]
        
        for i in range(len(child2["ekipler"])):
            if i < len(parent1["ekipler"]) and random.random() > 0.5:
                child2["ekipler"][i]["kisi_sayisi"] = parent1["ekipler"][i]["kisi_sayisi"]
        
        # Takt süresi çaprazlama
        if random.random() > 0.5:
            child1["takt_suresi"] = parent2["takt_suresi"]
            child2["takt_suresi"] = parent1["takt_suresi"]
        
        return [child1, child2]
    
    def mutate(self, chromosome: Dict[str, Any]) -> Dict[str, Any]:
        """Mutasyon"""
        mutated = chromosome.copy()
        
        # Zon mutasyonu
        if random.random() < self.config.mutation_rate:
            for zon in mutated["zonlar"]:
                if random.random() < 0.3:
                    zon["alan"] = int(zon["alan"] * random.uniform(0.8, 1.2))
                    zon["alan"] = max(50, min(250, zon["alan"]))
        
        # Ekip mutasyonu
        if random.random() < self.config.mutation_rate:
            for ekip in mutated["ekipler"]:
                if random.random() < 0.2:
                    ekip["kisi_sayisi"] += random.choice([-1, 0, 1])
                    ekip["kisi_sayisi"] = max(2, min(12, ekip["kisi_sayisi"]))
        
        # Takt süresi mutasyonu
        if random.random() < self.config.mutation_rate:
            mutated["takt_suresi"] += random.choice([-1, 0, 1])
            mutated["takt_suresi"] = max(3, min(20, mutated["takt_suresi"]))
        
        return mutated
    
    def initialize_population(self):
        """Başlangıç popülasyonunu oluştur"""
        self.population = []
        for _ in range(self.config.population_size):
            chromosome = self.create_chromosome()
            self.calculate_fitness(chromosome)
            self.population.append(chromosome)
        
        self.population.sort(key=lambda x: x["fitness"], reverse=True)
        self.best_chromosome = self.population[0].copy()
    
    def evolve_generation(self):
        """Bir jenerasyon evrim geçir"""
        new_population = []
        
        # Elitizm
        for i in range(self.config.elitism_count):
            if i < len(self.population):
                new_population.append(self.population[i].copy())
        
        # Yeni popülasyon
        while len(new_population) < self.config.population_size:
            parent1 = self.tournament_selection()
            parent2 = self.tournament_selection()
            
            children = self.crossover(parent1, parent2)
            
            for child in children:
                mutated = self.mutate(child)
                self.calculate_fitness(mutated)
                new_population.append(mutated)
                
                if len(new_population) >= self.config.population_size:
                    break
        
        self.population = new_population[:self.config.population_size]
        self.population.sort(key=lambda x: x["fitness"], reverse=True)
        
        # En iyiyi güncelle
        if self.population[0]["fitness"] > self.best_chromosome["fitness"]:
            self.best_chromosome = self.population[0].copy()
        
        # Geçmişi kaydet
        self.best_fitness_history.append(self.population[0]["fitness"])
        self.avg_fitness_history.append(
            sum(p["fitness"] for p in self.population) / len(self.population)
        )
    
    def optimize(self) -> Dict[str, Any]:
        """Optimizasyonu çalıştır"""
        self.initialize_population()
        
        for gen in range(self.config.generations):
            self.evolve_generation()
            
            # Her 20 jenerasyonda bir rapor
            if gen % 20 == 0:
                print(f"Generation {gen}: Best Fitness = {self.best_chromosome['fitness']:.4f}")
        
        # Senaryoları oluştur
        scenarios = self.generate_scenarios()
        
        return {
            "best_plan": self.best_chromosome,
            "scenarios": scenarios,
            "evolution_history": {
                "best_fitness": self.best_fitness_history,
                "avg_fitness": self.avg_fitness_history
            },
            "statistics": {
                "total_generations": self.config.generations,
                "population_size": self.config.population_size,
                "best_fitness": self.best_chromosome["fitness"],
                "best_duration": self.best_chromosome["duration"],
                "best_cost": self.best_chromosome["cost"]
            }
        }
    
    def generate_scenarios(self) -> List[Dict[str, Any]]:
        """3 farklı senaryo üret"""
        scenarios = []
        
        # 1. Hızlı Tren
        fast = self.best_chromosome.copy()
        fast["takt_suresi"] = max(3, fast["takt_suresi"] - 2)
        for ekip in fast["ekipler"]:
            ekip["kisi_sayisi"] += 2
        self.calculate_fitness(fast)
        fast["name"] = "⚡ Hızlı Tren"
        fast["description"] = "Minimum süre, yüksek işçilik maliyeti"
        scenarios.append(fast)
        
        # 2. Ekonomik
        eco = self.best_chromosome.copy()
        eco["takt_suresi"] = min(20, eco["takt_suresi"] + 2)
        for ekip in eco["ekipler"]:
            ekip["kisi_sayisi"] = max(2, ekip["kisi_sayisi"] - 1)
        self.calculate_fitness(eco)
        eco["name"] = "💰 Ekonomik"
        eco["description"] = "Minimum maliyet, uzun proje süresi"
        scenarios.append(eco)
        
        # 3. Dengeli (Önerilen)
        balanced = self.best_chromosome.copy()
        self.calculate_fitness(balanced)
        balanced["name"] = "🎯 Dengeli (Önerilen)"
        balanced["description"] = "Süre-maliyet-risk dengesi optimum"
        scenarios.append(balanced)
        
        return scenarios