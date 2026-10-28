// Kalkulasi jarak Haversine (km) antar dua titik koordinat
function calculateDistance(loc1, loc2) {
  const R = 6371; // Radius bumi dalam km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Buat Matriks Jarak N x N
function buildDistanceMatrix(locations) {
  const n = locations.length;
  const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        matrix[i][j] = calculateDistance(locations[i], locations[j]);
      }
    }
  }
  return matrix;
}

// Menghitung total jarak dari rute terpisah (solusi)
function evaluateSolution(routes, distMatrix) {
  let totalDistance = 0;
  for (const route of routes) {
    if (route.length === 0) continue;
    // Jarak dari Depot (indeks 0) ke pelanggan pertama
    let currentDist = distMatrix[0][route[0]];
    for (let i = 0; i < route.length - 1; i++) {
      currentDist += distMatrix[route[i]][route[i + 1]];
    }
    // Jarak dari pelanggan terakhir kembali ke Depot (indeks 0)
    currentDist += distMatrix[route[route.length - 1]][0];
    totalDistance += currentDist;
  }
  return totalDistance;
}

// Mengubah urutan permutasi menjadi rute-rute terpisah berdasarkan kapasitas kendaraan
function decodeChromosome(permutation, locations, vehicleCapacity, numVehicles) {
  const routes = [];
  let currentRoute = [];
  let currentLoad = 0;

  for (const customerIdx of permutation) {
    const demand = locations[customerIdx].demand;
    if (currentLoad + demand <= vehicleCapacity && routes.length < numVehicles) {
      currentRoute.push(customerIdx);
      currentLoad += demand;
    } else {
      if (currentRoute.length > 0) {
        routes.push(currentRoute);
      }
      currentRoute = [customerIdx];
      currentLoad = demand;
    }
  }
  if (currentRoute.length > 0 && routes.length < numVehicles) {
    routes.push(currentRoute);
  }
  return routes;
}

// Mengenerate populasi acak
function getRandomPermutation(customerIndices) {
  const arr = [...customerIndices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- ALGORITMA GENETIKA (GA) ---
function runGA(locations, params, distMatrix, customerIndices) {
  const { generations, popSize, capacity, vehicles } = params;
  let population = Array.from({ length: popSize }, () => getRandomPermutation(customerIndices));
  
  let bestPerm = null;
  let bestFitness = Infinity;
  const history = [];

  for (let gen = 0; gen < generations; gen++) {
    // Evaluasi
    const evaluated = population.map(perm => {
      const routes = decodeChromosome(perm, locations, capacity, vehicles);
      const fit = evaluateSolution(routes, distMatrix);
      if (fit < bestFitness) {
        bestFitness = fit;
        bestPerm = [...perm];
      }
      return { perm, fit };
    });

    history.push({ generation: gen + 1, fitness: Number(bestFitness.toFixed(2)) });

    // Seleksi & Crossover (Order Crossover / OX)
    const nextPop = [];
    evaluated.sort((a, b) => a.fit - b.fit);
    // Elitisme (Simpan 2 terbaik)
    nextPop.push(evaluated[0].perm, evaluated[1].perm);

    while (nextPop.length < popSize) {
      const parent1 = evaluated[Math.floor(Math.random() * (popSize / 2))].perm;
      const parent2 = evaluated[Math.floor(Math.random() * (popSize / 2))].perm;

      // Crossover OX
      const start = Math.floor(Math.random() * parent1.length);
      const end = start + Math.floor(Math.random() * (parent1.length - start));
      const child = Array(parent1.length).fill(-1);

      for (let i = start; i <= end; i++) child[i] = parent1[i];
      let p2Idx = 0;
      for (let i = 0; i < child.length; i++) {
        if (child[i] === -1) {
          while (child.includes(parent2[p2Idx])) p2Idx++;
          child[i] = parent2[p2Idx];
        }
      }

      // Mutasi Swap
      if (Math.random() < 0.2) {
        const idx1 = Math.floor(Math.random() * child.length);
        const idx2 = Math.floor(Math.random() * child.length);
        [child[idx1], child[idx2]] = [child[idx2], child[idx1]];
      }

      nextPop.push(child);
    }
    population = nextPop;
  }

  return {
    bestRoutes: decodeChromosome(bestPerm, locations, capacity, vehicles),
    bestDistance: bestFitness,
    history
  };
}

// --- ALGORITMA ARTIFICIAL BEE COLONY (ABC) ---
function runABC(locations, params, distMatrix, customerIndices) {
  const { generations, popSize, capacity, vehicles } = params;
  let foodSources = Array.from({ length: popSize }, () => getRandomPermutation(customerIndices));
  let trialLimits = Array(popSize).fill(0);
  const maxTrials = 10;

  let bestPerm = null;
  let bestFitness = Infinity;
  const history = [];

  for (let gen = 0; gen < generations; gen++) {
    // Employed Bees Phase
    for (let i = 0; i < popSize; i++) {
      const newPerm = [...foodSources[i]];
      const idx1 = Math.floor(Math.random() * newPerm.length);
      const idx2 = Math.floor(Math.random() * newPerm.length);
      [newPerm[idx1], newPerm[idx2]] = [newPerm[idx2], newPerm[idx1]];

      const currentFit = evaluateSolution(decodeChromosome(foodSources[i], locations, capacity, vehicles), distMatrix);
      const newFit = evaluateSolution(decodeChromosome(newPerm, locations, capacity, vehicles), distMatrix);

      if (newFit < currentFit) {
        foodSources[i] = newPerm;
        trialLimits[i] = 0;
      } else {
        trialLimits[i]++;
      }
    }

    // Onlooker Bees Phase
    for (let i = 0; i < popSize; i++) {
      const selected = Math.floor(Math.random() * popSize);
      const newPerm = [...foodSources[selected]];
      const idx1 = Math.floor(Math.random() * newPerm.length);
      const idx2 = Math.floor(Math.random() * newPerm.length);
      [newPerm[idx1], newPerm[idx2]] = [newPerm[idx2], newPerm[idx1]];

      const currentFit = evaluateSolution(decodeChromosome(foodSources[selected], locations, capacity, vehicles), distMatrix);
      const newFit = evaluateSolution(decodeChromosome(newPerm, locations, capacity, vehicles), distMatrix);

      if (newFit < currentFit) {
        foodSources[selected] = newPerm;
        trialLimits[selected] = 0;
      } else {
        trialLimits[selected]++;
      }
    }

    // Scout Bees Phase
    for (let i = 0; i < popSize; i++) {
      if (trialLimits[i] > maxTrials) {
        foodSources[i] = getRandomPermutation(customerIndices);
        trialLimits[i] = 0;
      }
    }

    // Cek Best
    for (let i = 0; i < popSize; i++) {
      const fit = evaluateSolution(decodeChromosome(foodSources[i], locations, capacity, vehicles), distMatrix);
      if (fit < bestFitness) {
        bestFitness = fit;
        bestPerm = [...foodSources[i]];
      }
    }

    history.push({ generation: gen + 1, fitness: Number(bestFitness.toFixed(2)) });
  }

  return {
    bestRoutes: decodeChromosome(bestPerm, locations, capacity, vehicles),
    bestDistance: bestFitness,
    history
  };
}

// --- HYBRID (GA + ABC) ---
function runHybrid(locations, params, distMatrix, customerIndices) {
  // Menjalankan setengah iterasi dengan GA untuk eksplorasi global,
  // lalu dipoles menggunakan pencarian lokal eksploitasi khas ABC.
  const halfGen = Math.floor(params.generations / 2);
  const gaResult = runGA(locations, { ...params, generations: halfGen }, distMatrix, customerIndices);
  const abcResult = runABC(locations, { ...params, generations: params.generations - halfGen }, distMatrix, customerIndices);

  const bestDistance = Math.min(gaResult.bestDistance, abcResult.bestDistance);
  const bestRoutes = gaResult.bestDistance < abcResult.bestDistance ? gaResult.bestRoutes : abcResult.bestRoutes;
  
  const history = [
    ...gaResult.history,
    ...abcResult.history.map((h, i) => ({ generation: halfGen + i + 1, fitness: Math.min(h.fitness, gaResult.bestDistance) }))
  ];

  return { bestRoutes, bestDistance, history };
}

// Worker Listener
self.onmessage = function (e) {
  const { algorithm, locations, params } = e.data;
  const startTime = performance.now();

  const distMatrix = buildDistanceMatrix(locations);
  const customerIndices = locations.map((_, idx) => idx).filter(idx => !locations[idx].isDepot);

  let result;
  if (algorithm === 'GA') {
    result = runGA(locations, params, distMatrix, customerIndices);
  } else if (algorithm === 'ABC') {
    result = runABC(locations, params, distMatrix, customerIndices);
  } else if (algorithm === 'HYBRID') {
    result = runHybrid(locations, params, distMatrix, customerIndices);
  } else if (algorithm === 'BENCHMARK') {
    const gaRes = runGA(locations, params, distMatrix, customerIndices);
    const abcRes = runABC(locations, params, distMatrix, customerIndices);
    const hybridRes = runHybrid(locations, params, distMatrix, customerIndices);

    const endTime = performance.now();
    self.postMessage({
      status: 'SUCCESS',
      isBenchmark: true,
      data: {
        GA: { ...gaRes, time: (endTime - startTime).toFixed(1) },
        ABC: { ...abcRes, time: (endTime - startTime).toFixed(1) },
        HYBRID: { ...hybridRes, time: (endTime - startTime).toFixed(1) }
      }
    });
    return;
  }

  const endTime = performance.now();
  self.postMessage({
    status: 'SUCCESS',
    isBenchmark: false,
    algorithm,
    data: {
      ...result,
      executionTime: (endTime - startTime).toFixed(1)
    }
  });
};