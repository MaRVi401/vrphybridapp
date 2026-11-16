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

// Buat Matriks Jarak N x N (simetris)
function buildDistanceMatrix(locations) {
  const n = locations.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = calculateDistance(locations[i], locations[j]);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }
  return matrix;
}

// Evaluasi total jarak (km) + penalti jika melebihi kapasitas kendaraan
function evaluateSolution(routes, distMatrix, depotIdx, locations, vehicleCapacity) {
  let totalDistance = 0;
  let totalPenalty = 0;
  const PENALTY_WEIGHT = 1000;

  for (const route of routes) {
    if (route.length === 0) continue;

    let currentDist = distMatrix[depotIdx][route[0]];
    let routeDemand = locations[route[0]].demand || 0;

    for (let i = 0; i < route.length - 1; i++) {
      currentDist += distMatrix[route[i]][route[i + 1]];
      routeDemand += locations[route[i + 1]].demand || 0;
    }

    currentDist += distMatrix[route[route.length - 1]][depotIdx];
    totalDistance += currentDist;

    if (routeDemand > vehicleCapacity) {
      totalPenalty += (routeDemand - vehicleCapacity) * PENALTY_WEIGHT;
    }
  }

  return {
    distance: totalDistance,
    fitness: totalDistance + totalPenalty,
    isFeasible: totalPenalty === 0,
  };
}

// Mengubah urutan permutasi menjadi rute-rute terpisah berdasarkan kapasitas kendaraan
function decodeChromosome(permutation, locations, vehicleCapacity, numVehicles) {
  if (numVehicles <= 0) return [];
  const routes = [];
  let currentRoute = [];
  let currentLoad = 0;

  for (const customerIdx of permutation) {
    const demand = locations[customerIdx].demand || 0;

    if (currentLoad + demand <= vehicleCapacity) {
      currentRoute.push(customerIdx);
      currentLoad += demand;
    } else {
      if (currentRoute.length > 0) {
        if (routes.length < numVehicles) {
          routes.push(currentRoute);
        } else {
          routes[routes.length - 1].push(customerIdx);
        }
      }
      currentRoute = [customerIdx];
      currentLoad = demand;
    }
  }

  if (currentRoute.length > 0) {
    if (routes.length < numVehicles) {
      routes.push(currentRoute);
    } else if (routes.length > 0) {
      routes[routes.length - 1].push(...currentRoute);
    }
  }

  return routes;
}

// Generate permutasi acak (Fisher-Yates Shuffle)
function getRandomPermutation(customerIndices) {
  const arr = [...customerIndices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Operator Neighborhood VRP: Swap, Insertion (Relocate), dan 2-Opt
function mutateRouteNeighborhood(perm) {
  const arr = [...perm];
  const n = arr.length;
  if (n < 2) return arr;

  const op = Math.random();
  const i = Math.floor(Math.random() * n);
  let j = Math.floor(Math.random() * (n - 1));
  if (j >= i) j++;

  if (op < 0.33) {
    // 1. Swap: Tukar dua titik pelanggan
    [arr[i], arr[j]] = [arr[j], arr[i]];
  } else if (op < 0.66) {
    // 2. Insertion / Relocate: Pindahkan satu pelanggan ke posisi/rute lain
    const [removed] = arr.splice(i, 1);
    arr.splice(j, 0, removed);
  } else {
    // 3. 2-Opt: Balik sub-segmen rute untuk menghilangkan jalur bersilangan
    const start = Math.min(i, j);
    const end = Math.max(i, j);
    const reversedSegment = arr.slice(start, end + 1).reverse();
    arr.splice(start, end - start + 1, ...reversedSegment);
  }

  return arr;
}

// --- ALGORITMA GENETIKA (GA) ---
function runGA(locations, params, distMatrix, customerIndices, depotIdx) {
  const { generations, popSize, capacity, vehicles } = params;
  let population = Array.from({ length: popSize }, () =>
    getRandomPermutation(customerIndices)
  );

  let bestPerm = [...population[0]];
  let bestEval = { distance: Infinity, fitness: Infinity, isFeasible: false };
  const history = [];

  for (let gen = 0; gen < generations; gen++) {
    const evaluated = population.map((perm) => {
      const routes = decodeChromosome(perm, locations, capacity, vehicles);
      const evalRes = evaluateSolution(routes, distMatrix, depotIdx, locations, capacity);
      if (evalRes.fitness < bestEval.fitness) {
        bestEval = evalRes;
        bestPerm = [...perm];
      }
      return { perm, fit: evalRes.fitness };
    });

    history.push({
      generation: gen + 1,
      fitness: Number(bestEval.distance.toFixed(2)),
    });

    evaluated.sort((a, b) => a.fit - b.fit);

    // Elitisme (simpan 2 individu terbaik)
    const nextPop = [evaluated[0].perm];
    if (popSize > 1) nextPop.push(evaluated[1].perm);

    const poolSize = Math.max(1, Math.floor(popSize / 2));
    while (nextPop.length < popSize) {
      const parent1 = evaluated[Math.floor(Math.random() * poolSize)].perm;
      const parent2 = evaluated[Math.floor(Math.random() * poolSize)].perm;

      // Order Crossover (OX)
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

      // Mutasi Neighborhood (probabilitas 20%)
      nextPop.push(Math.random() < 0.2 ? mutateRouteNeighborhood(child) : child);
    }
    population = nextPop;
  }

  return {
    bestRoutes: decodeChromosome(bestPerm, locations, capacity, vehicles),
    bestDistance: bestEval.distance,
    isFeasible: bestEval.isFeasible,
    history,
    finalPopulation: population,
    bestPerm,
    bestEval,
  };
}

// --- ALGORITMA ARTIFICIAL BEE COLONY (ABC) ---
function runABC(locations, params, distMatrix, customerIndices, depotIdx, seedState = null) {
  const { generations, popSize, capacity, vehicles } = params;

  // Gunakan populasi dari GA jika dipanggil dari mode HYBRID
  let foodSources = seedState?.population
    ? seedState.population.map((p) => [...p])
    : Array.from({ length: popSize }, () => getRandomPermutation(customerIndices));

  let fitnessCache = foodSources.map((perm) =>
    evaluateSolution(
      decodeChromosome(perm, locations, capacity, vehicles),
      distMatrix,
      depotIdx,
      locations,
      capacity
    )
  );

  let trialLimits = Array(popSize).fill(0);
  const maxTrials = 15;

  let bestPerm = seedState?.bestPerm ? [...seedState.bestPerm] : [...foodSources[0]];
  let bestEval = seedState?.bestEval || { ...fitnessCache[0] };
  const history = [];

  for (let gen = 0; gen < generations; gen++) {
    // 1. Employed Bees Phase
    for (let i = 0; i < popSize; i++) {
      const newPerm = mutateRouteNeighborhood(foodSources[i]);
      const newEval = evaluateSolution(
        decodeChromosome(newPerm, locations, capacity, vehicles),
        distMatrix,
        depotIdx,
        locations,
        capacity
      );

      if (newEval.fitness < fitnessCache[i].fitness) {
        foodSources[i] = newPerm;
        fitnessCache[i] = newEval;
        trialLimits[i] = 0;
      } else {
        trialLimits[i]++;
      }
    }

    // 2. Onlooker Bees Phase (Roulette Wheel Selection berbasis kualitas fitness)
    const qualities = fitnessCache.map((e) => 1 / (1 + e.fitness));
    const totalQuality = qualities.reduce((sum, q) => sum + q, 0);

    for (let i = 0; i < popSize; i++) {
      let r = Math.random() * totalQuality;
      let selected = 0;
      for (let j = 0; j < popSize; j++) {
        r -= qualities[j];
        if (r <= 0) {
          selected = j;
          break;
        }
      }

      const newPerm = mutateRouteNeighborhood(foodSources[selected]);
      const newEval = evaluateSolution(
        decodeChromosome(newPerm, locations, capacity, vehicles),
        distMatrix,
        depotIdx,
        locations,
        capacity
      );

      if (newEval.fitness < fitnessCache[selected].fitness) {
        foodSources[selected] = newPerm;
        fitnessCache[selected] = newEval;
        trialLimits[selected] = 0;
      } else {
        trialLimits[selected]++;
      }
    }

    // 3. Scout Bees Phase (Lindungi sumber makanan terbaik agar tidak di-reset)
    let bestSourceIdx = 0;
    for (let i = 1; i < popSize; i++) {
      if (fitnessCache[i].fitness < fitnessCache[bestSourceIdx].fitness) {
        bestSourceIdx = i;
      }
    }

    for (let i = 0; i < popSize; i++) {
      if (i !== bestSourceIdx && trialLimits[i] > maxTrials) {
        foodSources[i] = getRandomPermutation(customerIndices);
        fitnessCache[i] = evaluateSolution(
          decodeChromosome(foodSources[i], locations, capacity, vehicles),
          distMatrix,
          depotIdx,
          locations,
          capacity
        );
        trialLimits[i] = 0;
      }
    }

    // Update Global Best
    for (let i = 0; i < popSize; i++) {
      if (fitnessCache[i].fitness < bestEval.fitness) {
        bestEval = { ...fitnessCache[i] };
        bestPerm = [...foodSources[i]];
      }
    }

    history.push({
      generation: gen + 1,
      fitness: Number(bestEval.distance.toFixed(2)),
    });
  }

  return {
    bestRoutes: decodeChromosome(bestPerm, locations, capacity, vehicles),
    bestDistance: bestEval.distance,
    isFeasible: bestEval.isFeasible,
    history,
  };
}

// --- HYBRID (GA -> ABC Sequential Refinement) ---
function runHybrid(locations, params, distMatrix, customerIndices, depotIdx) {
  const halfGen = Math.floor(params.generations / 2);
  const remGen = params.generations - halfGen;

  // Tahap 1: Eksplorasi global dengan GA
  const gaResult = runGA(
    locations,
    { ...params, generations: halfGen },
    distMatrix,
    customerIndices,
    depotIdx
  );

  // Tahap 2: Eksploitasi lokal melanjutkan populasi terbaik dari GA
  const abcResult = runABC(
    locations,
    { ...params, generations: remGen },
    distMatrix,
    customerIndices,
    depotIdx,
    {
      population: gaResult.finalPopulation,
      bestPerm: gaResult.bestPerm,
      bestEval: gaResult.bestEval,
    }
  );

  const history = [
    ...gaResult.history,
    ...abcResult.history.map((h, i) => ({
      generation: halfGen + i + 1,
      fitness: h.fitness,
    })),
  ];

  return {
    bestRoutes: abcResult.bestRoutes,
    bestDistance: abcResult.bestDistance,
    isFeasible: abcResult.isFeasible,
    history,
  };
}

// Worker Listener
self.onmessage = function (e) {
  const { algorithm, locations, params } = e.data;
  const distMatrix = buildDistanceMatrix(locations);

  const foundDepot = locations.findIndex((l) => l.isDepot);
  const depotIdx = foundDepot !== -1 ? foundDepot : 0;
  const customerIndices = locations
    .map((_, idx) => idx)
    .filter((idx) => idx !== depotIdx);

  if (algorithm === "BENCHMARK") {
    const t0 = performance.now();
    const gaRes = runGA(locations, params, distMatrix, customerIndices, depotIdx);
    const t1 = performance.now();
    const abcRes = runABC(locations, params, distMatrix, customerIndices, depotIdx);
    const t2 = performance.now();
    const hybridRes = runHybrid(locations, params, distMatrix, customerIndices, depotIdx);
    const t3 = performance.now();

    self.postMessage({
      status: "SUCCESS",
      isBenchmark: true,
      data: {
        GA: { ...gaRes, time: (t1 - t0).toFixed(1), executionTime: (t1 - t0).toFixed(1) },
        ABC: { ...abcRes, time: (t2 - t1).toFixed(1), executionTime: (t2 - t1).toFixed(1) },
        HYBRID: { ...hybridRes, time: (t3 - t2).toFixed(1), executionTime: (t3 - t2).toFixed(1) },
      },
    });
    return;
  }

  const startTime = performance.now();
  let result;
  if (algorithm === "GA") {
    result = runGA(locations, params, distMatrix, customerIndices, depotIdx);
  } else if (algorithm === "ABC") {
    result = runABC(locations, params, distMatrix, customerIndices, depotIdx);
  } else {
    result = runHybrid(locations, params, distMatrix, customerIndices, depotIdx);
  }
  const endTime = performance.now();

  self.postMessage({
    status: "SUCCESS",
    isBenchmark: false,
    algorithm,
    data: {
      ...result,
      executionTime: (endTime - startTime).toFixed(1),
    },
  });
};