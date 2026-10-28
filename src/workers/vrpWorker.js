// ==========================================
// 1. HELPER MATEMATIKA & MATRIKS JARAK
// ==========================================

// Perhitungan Jarak Haversine (KM) antar dua koordinat latitude & longitude
function haversineDistance(loc1, loc2) {
  const R = 6371; // Jari-jari Bumi (KM)
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Generate Matriks Jarak antar seluruh titik lokasi
function createDistanceMatrix(locations) {
  const matrix = [];
  for (let i = 0; i < locations.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < locations.length; j++) {
      matrix[i][j] = haversineDistance(locations[i], locations[j]);
    }
  }
  return matrix;
}

// Split Flat Route (Array Pelanggan) ke Dalam Rute Masing-Masing Kendaraan
function splitToRoutes(flatRoute, numVehicles) {
  if (!flatRoute || !Array.isArray(flatRoute)) return [];

  const routes = Array.from({ length: numVehicles }, () => []);
  flatRoute.forEach((customerIdx, i) => {
    routes[i % numVehicles].push(customerIdx);
  });
  return routes;
}

// ==========================================
// 2. FUNGSI EVALUASI FITNESS & PENALTI
// ==========================================

function evaluateSolution(routes, distanceMatrix, locations, vehicleCapacity) {
  // Guard Clause: Mencegah error jika routes undefined / bukan Array
  if (!routes || !Array.isArray(routes) || routes.length === 0) {
    return { totalDistance: Infinity, totalPenalty: Infinity, cost: Infinity, fitness: 0 };
  }

  let totalDistance = 0;
  let totalPenalty = 0;

  routes.forEach((route) => {
    if (!route || !Array.isArray(route) || route.length === 0) return;

    let routeDistance = 0;
    let routeLoad = 0;

    // 1. Jarak dari Depot (indeks 0) ke pelanggan pertama
    routeDistance += distanceMatrix[0][route[0]];
    routeLoad += locations[route[0]]?.demand || 0;

    // 2. Jarak antar pelanggan dalam 1 rute
    for (let i = 0; i < route.length - 1; i++) {
      routeDistance += distanceMatrix[route[i]][route[i + 1]];
      routeLoad += locations[route[i + 1]]?.demand || 0;
    }

    // 3. Jarak kembali dari pelanggan terakhir ke Depot (indeks 0)
    routeDistance += distanceMatrix[route[route.length - 1]][0];
    totalDistance += routeDistance;

    // 4. Hitung Penalti jika muatan melebihi kapasitas kendaraan
    if (routeLoad > vehicleCapacity) {
      totalPenalty += (routeLoad - vehicleCapacity) * 100;
    }
  });

  const cost = totalDistance + totalPenalty;
  const fitness = 1 / (1 + cost);

  return { totalDistance, totalPenalty, cost, fitness };
}

// ==========================================
// 3. OPERATOR GENETIC ALGORITHM (GA)
// ==========================================

// Ordered Crossover (OX) untuk meretain permutasi unik urutan lokasi
function orderedCrossover(parentA, parentB) {
  const length = parentA.length;
  if (length <= 2) return [...parentA];

  const start = Math.floor(Math.random() * (length - 1));
  const end = Math.floor(Math.random() * (length - start)) + start;

  const child = Array(length).fill(null);
  for (let i = start; i <= end; i++) {
    child[i] = parentA[i];
  }

  let currentChildIdx = (end + 1) % length;
  for (let i = 0; i < length; i++) {
    const parent2Idx = (end + 1 + i) % length;
    const item = parentB[parent2Idx];
    if (!child.includes(item)) {
      child[currentChildIdx] = item;
      currentChildIdx = (currentChildIdx + 1) % length;
    }
  }
  return child;
}

// Swap Mutation: Menukar dua titik pelanggan secara acak
function swapMutation(flatRoute, mutationRate) {
  const mutated = [...flatRoute];
  if (Math.random() < mutationRate && mutated.length > 1) {
    const idx1 = Math.floor(Math.random() * mutated.length);
    let idx2 = Math.floor(Math.random() * mutated.length);
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * mutated.length);

    const temp = mutated[idx1];
    mutated[idx1] = mutated[idx2];
    mutated[idx2] = temp;
  }
  return mutated;
}

// ==========================================
// 4. WORKER EVENT LISTENER (MAIN ENGINE)
// ==========================================

self.onmessage = function (e) {
  const { locations, params } = e.data;
  const {
    popSize = 40,
    maxIterations = 150,
    limit = 15,
    numVehicles = 3,
    vehicleCapacity = 100,
    crossoverRate = 0.8,
    mutationRate = 0.2,
  } = params || {};

  if (!locations || locations.length < 2) {
    self.postMessage({ type: "ERROR", message: "Data lokasi minimal 2 (1 Depot + 1 Pelanggan)" });
    return;
  }

  const distanceMatrix = createDistanceMatrix(locations);
  const customerIndices = Array.from({ length: locations.length - 1 }, (_, i) => i + 1);

  // 1. INISIALISASI POPULASI LEBAH
  let population = Array.from({ length: popSize }, () => {
    const shuffled = [...customerIndices].sort(() => Math.random() - 0.5);
    const routes = splitToRoutes(shuffled, numVehicles);
    const evalResult = evaluateSolution(routes, distanceMatrix, locations, vehicleCapacity);
    return {
      flatRoute: shuffled,
      routes,
      ...evalResult,
      trial: 0,
    };
  });

  let bestSolution = JSON.parse(JSON.stringify(population[0]));
  population.forEach((bee) => {
    if (bee.fitness > bestSolution.fitness) {
      bestSolution = JSON.parse(JSON.stringify(bee));
    }
  });

  // 2. LOOP UTAMA ITERASI ALGORITMA
  for (let iter = 1; iter <= maxIterations; iter++) {
    // A. FASE EMPLOYED BEES + OPERATOR GA
    population = population.map((bee) => {
      let candidateFlat = [...bee.flatRoute];

      // Injeksi GA: Ordered Crossover
      if (Math.random() < crossoverRate) {
        const partner = population[Math.floor(Math.random() * popSize)];
        candidateFlat = orderedCrossover(bee.flatRoute, partner.flatRoute);
      }

      // Injeksi GA: Swap Mutation
      candidateFlat = swapMutation(candidateFlat, mutationRate);

      const candidateRoutes = splitToRoutes(candidateFlat, numVehicles);
      const candidateEval = evaluateSolution(candidateRoutes, distanceMatrix, locations, vehicleCapacity);

      // Greedy Selection
      if (candidateEval.fitness > bee.fitness) {
        return { flatRoute: candidateFlat, routes: candidateRoutes, ...candidateEval, trial: 0 };
      } else {
        return { ...bee, trial: bee.trial + 1 };
      }
    });

    // Update Best Solution Global
    population.forEach((bee) => {
      if (bee.fitness > bestSolution.fitness) {
        bestSolution = JSON.parse(JSON.stringify(bee));
      }
    });

    // B. FASE ONLOOKER BEES (Roulette Wheel Selection)
    const totalFitness = population.reduce((acc, curr) => acc + curr.fitness, 0) || 1;
    for (let i = 0; i < popSize; i++) {
      if (Math.random() < population[i].fitness / totalFitness) {
        let newFlat = swapMutation(population[i].flatRoute, mutationRate);
        let newRoutes = splitToRoutes(newFlat, numVehicles);
        let newEval = evaluateSolution(newRoutes, distanceMatrix, locations, vehicleCapacity);

        if (newEval.fitness > population[i].fitness) {
          population[i] = { flatRoute: newFlat, routes: newRoutes, ...newEval, trial: 0 };
        }
      }
    }

    // C. FASE SCOUT BEES (Reset Rute Stagnan)
    population = population.map((bee) => {
      if (bee.trial >= limit) {
        const randomFlat = [...customerIndices].sort(() => Math.random() - 0.5);
        const randomRoutes = splitToRoutes(randomFlat, numVehicles);
        const randomEval = evaluateSolution(randomRoutes, distanceMatrix, locations, vehicleCapacity);
        return { flatRoute: randomFlat, routes: randomRoutes, ...randomEval, trial: 0 };
      }
      return bee;
    });

    // D. STREAM PROGRESS KE UI PER 5 ITERASI
    if (iter % 5 === 0 || iter === maxIterations) {
      self.postMessage({
        type: "PROGRESS",
        iteration: iter,
        bestDistance: bestSolution.totalDistance.toFixed(2),
        bestSolution,
      });
    }
  }

  // 3. KIRIM HASIL AKHIR PADA ITERASI SELESAI
  self.postMessage({
    type: "COMPLETE",
    bestSolution,
  });
};