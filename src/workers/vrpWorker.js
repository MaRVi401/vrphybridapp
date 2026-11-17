// Kalkulasi jarak Haversine (km) antar dua titik koordinat
function calculateDistance(loc1, loc2) {
  const R = 6371;
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

// Menghitung jarak satu rute tunggal dari Depot -> pelanggan -> Depot
function getSingleRouteDistance(route, distMatrix, depotIdx) {
  if (!route || route.length === 0) return 0;
  let dist = distMatrix[depotIdx][route[0]];
  for (let i = 0; i < route.length - 1; i++) {
    dist += distMatrix[route[i]][route[i + 1]];
  }
  dist += distMatrix[route[route.length - 1]][depotIdx];
  return dist;
}

// Evaluasi total jarak (km) + penalti overload
function evaluateSolution(
  routes,
  distMatrix,
  depotIdx,
  locations,
  vehicleCapacity,
) {
  let totalDistance = 0;
  let totalPenalty = 0;
  const OVERLOAD_PENALTY = 1000;

  for (const route of routes) {
    if (route.length === 0) continue;

    totalDistance += getSingleRouteDistance(route, distMatrix, depotIdx);

    let routeDemand = 0;
    for (const cIdx of route) {
      routeDemand += locations[cIdx].demand || 0;
    }

    if (routeDemand > vehicleCapacity) {
      totalPenalty += (routeDemand - vehicleCapacity) * OVERLOAD_PENALTY;
    }
  }

  return {
    distance: totalDistance,
    fitness: totalDistance + totalPenalty,
    isFeasible: totalPenalty === 0,
  };
}

// Algoritma Split Prins (Dynamic Programming) untuk memotong Giant Tour secara optimal
function decodeChromosome(
  permutation,
  locations,
  vehicleCapacity,
  numVehicles,
  distMatrix,
  depotIdx,
) {
  const m = permutation.length;
  if (numVehicles <= 0 || m === 0) return [];

  // Precompute biaya perjalanan untuk setiap segmen [i..j]
  const segCost = Array.from({ length: m }, () => Array(m).fill(Infinity));
  for (let i = 0; i < m; i++) {
    let load = 0;
    let dist = 0;
    for (let j = i; j < m; j++) {
      const cust = permutation[j];
      load += locations[cust].demand || 0;
      if (j === i) {
        dist = distMatrix[depotIdx][cust];
      } else {
        dist += distMatrix[permutation[j - 1]][cust];
      }
      const totalTripDist = dist + distMatrix[cust][depotIdx];
      const penalty =
        load > vehicleCapacity ? (load - vehicleCapacity) * 1000 : 0;
      segCost[i][j] = totalTripDist + penalty;
    }
  }

  // DP: dp[k][j] = biaya minimum membagi j pelanggan pertama ke dalam k armada
  const dp = Array.from({ length: numVehicles + 1 }, () =>
    Array(m + 1).fill(Infinity),
  );
  const parent = Array.from({ length: numVehicles + 1 }, () =>
    Array(m + 1).fill(-1),
  );
  dp[0][0] = 0;

  for (let k = 1; k <= numVehicles; k++) {
    for (let j = 1; j <= m; j++) {
      for (let i = k - 1; i < j; i++) {
        if (dp[k - 1][i] === Infinity) continue;
        const cost = dp[k - 1][i] + segCost[i][j - 1];
        if (cost < dp[k][j]) {
          dp[k][j] = cost;
          parent[k][j] = i;
        }
      }
    }
  }

  // Pilih jumlah armada k terbaik (1..numVehicles) yang mencakup seluruh m pelanggan
  let bestK = numVehicles;
  let bestTotal = Infinity;
  for (let k = 1; k <= numVehicles; k++) {
    if (dp[k][m] < bestTotal) {
      bestTotal = dp[k][m];
      bestK = k;
    }
  }

  // Rekonstruksi rute dari tabel parent
  const routes = [];
  let currJ = m;
  for (let k = bestK; k >= 1; k--) {
    const prevI = parent[k][currJ];
    if (prevI === -1) break;
    routes.unshift(permutation.slice(prevI, currJ));
    currJ = prevI;
  }

  return routes.length > 0 ? routes : [permutation];
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

// Operator Neighborhood acak untuk GA & ABC
function mutateRouteNeighborhood(perm) {
  const arr = [...perm];
  const n = arr.length;
  if (n < 2) return arr;

  const op = Math.random();
  const i = Math.floor(Math.random() * n);
  let j = Math.floor(Math.random() * (n - 1));
  if (j >= i) j++;

  if (op < 0.34) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
  } else if (op < 0.67) {
    const [removed] = arr.splice(i, 1);
    arr.splice(j, 0, removed);
  } else {
    const start = Math.min(i, j);
    const end = Math.max(i, j);
    const reversedSegment = arr.slice(start, end + 1).reverse();
    arr.splice(start, end - start + 1, ...reversedSegment);
  }

  return arr;
}

// --- LOCAL SEARCH EKSPLOITASI KHUSUS MEMETIC HYBRID ---

// 1. Intra-Route 2-Opt: Meluruskan jalur bersilangan di dalam masing-masing rute armada
function applyIntraRoute2Opt(routes, distMatrix, depotIdx) {
  return routes.map((route) => {
    if (route.length < 3) return [...route];
    let bestRoute = [...route];
    let bestDist = getSingleRouteDistance(bestRoute, distMatrix, depotIdx);
    let improved = true;

    while (improved) {
      improved = false;
      for (let i = 0; i < bestRoute.length - 1; i++) {
        for (let k = i + 1; k < bestRoute.length; k++) {
          const candidate = [
            ...bestRoute.slice(0, i),
            ...bestRoute.slice(i, k + 1).reverse(),
            ...bestRoute.slice(k + 1),
          ];
          const candDist = getSingleRouteDistance(
            candidate,
            distMatrix,
            depotIdx,
          );
          if (candDist + 1e-6 < bestDist) {
            bestRoute = candidate;
            bestDist = candDist;
            improved = true;
          }
        }
      }
    }
    return bestRoute;
  });
}

// 2. Inter-Route Relocate (1-0) + Inter-Route Swap (1-1)
function applyInterRouteOptimization(
  routes,
  distMatrix,
  depotIdx,
  locations,
  capacity,
) {
  let currentRoutes = routes.map((r) => [...r]).filter((r) => r.length > 0);
  let improved = true;

  while (improved) {
    improved = false;
    const loads = currentRoutes.map((r) =>
      r.reduce((sum, idx) => sum + (locations[idx].demand || 0), 0),
    );

    // A. Inter-Route Relocate (1-0)
    for (let rFrom = 0; rFrom < currentRoutes.length; rFrom++) {
      for (let posFrom = 0; posFrom < currentRoutes[rFrom].length; posFrom++) {
        const customer = currentRoutes[rFrom][posFrom];
        const custDemand = locations[customer].demand || 0;

        for (let rTo = 0; rTo < currentRoutes.length; rTo++) {
          if (rFrom === rTo || loads[rTo] + custDemand > capacity) continue;

          const oldDist =
            getSingleRouteDistance(currentRoutes[rFrom], distMatrix, depotIdx) +
            getSingleRouteDistance(currentRoutes[rTo], distMatrix, depotIdx);

          const newFrom = currentRoutes[rFrom].filter(
            (_, idx) => idx !== posFrom,
          );
          const newFromDist = getSingleRouteDistance(
            newFrom,
            distMatrix,
            depotIdx,
          );

          let bestInsertPos = -1;
          let bestNewDist = oldDist;

          for (let posTo = 0; posTo <= currentRoutes[rTo].length; posTo++) {
            const candidateTo = [
              ...currentRoutes[rTo].slice(0, posTo),
              customer,
              ...currentRoutes[rTo].slice(posTo),
            ];
            const totalNewDist =
              newFromDist +
              getSingleRouteDistance(candidateTo, distMatrix, depotIdx);

            if (totalNewDist + 1e-6 < bestNewDist) {
              bestNewDist = totalNewDist;
              bestInsertPos = posTo;
            }
          }

          if (bestInsertPos !== -1) {
            currentRoutes[rFrom] = newFrom;
            currentRoutes[rTo].splice(bestInsertPos, 0, customer);
            currentRoutes = currentRoutes.filter((r) => r.length > 0);
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
      if (improved) break;
    }

    if (improved) continue;

    // B. Inter-Route Swap (1-1)
    for (let r1 = 0; r1 < currentRoutes.length; r1++) {
      for (let p1 = 0; p1 < currentRoutes[r1].length; p1++) {
        const c1 = currentRoutes[r1][p1];
        const d1 = locations[c1].demand || 0;

        for (let r2 = r1 + 1; r2 < currentRoutes.length; r2++) {
          for (let p2 = 0; p2 < currentRoutes[r2].length; p2++) {
            const c2 = currentRoutes[r2][p2];
            const d2 = locations[c2].demand || 0;

            if (
              loads[r1] - d1 + d2 > capacity ||
              loads[r2] - d2 + d1 > capacity
            ) {
              continue;
            }

            const oldDist =
              getSingleRouteDistance(currentRoutes[r1], distMatrix, depotIdx) +
              getSingleRouteDistance(currentRoutes[r2], distMatrix, depotIdx);

            const rem1 = currentRoutes[r1].filter((_, idx) => idx !== p1);
            const rem2 = currentRoutes[r2].filter((_, idx) => idx !== p2);

            let bestCand1 = null;
            let bestDist1 = Infinity;
            for (let ins1 = 0; ins1 <= rem1.length; ins1++) {
              const cand1 = [...rem1.slice(0, ins1), c2, ...rem1.slice(ins1)];
              const dist1 = getSingleRouteDistance(cand1, distMatrix, depotIdx);
              if (dist1 < bestDist1) {
                bestDist1 = dist1;
                bestCand1 = cand1;
              }
            }

            let bestCand2 = null;
            let bestDist2 = Infinity;
            for (let ins2 = 0; ins2 <= rem2.length; ins2++) {
              const cand2 = [...rem2.slice(0, ins2), c1, ...rem2.slice(ins2)];
              const dist2 = getSingleRouteDistance(cand2, distMatrix, depotIdx);
              if (dist2 < bestDist2) {
                bestDist2 = dist2;
                bestCand2 = cand2;
              }
            }

            if (bestDist1 + bestDist2 + 1e-6 < oldDist) {
              currentRoutes[r1] = bestCand1;
              currentRoutes[r2] = bestCand2;
              improved = true;
              break;
            }
          }
          if (improved) break;
        }
        if (improved) break;
      }
      if (improved) break;
    }
  }

  return applyIntraRoute2Opt(currentRoutes, distMatrix, depotIdx);
}

function refineRoutesMemetic(
  routes,
  distMatrix,
  depotIdx,
  locations,
  capacity,
) {
  return applyInterRouteOptimization(
    routes,
    distMatrix,
    depotIdx,
    locations,
    capacity,
  );
}

// --- ALGORITMA GENETIKA (GA) ---
function runGA(locations, params, distMatrix, customerIndices, depotIdx) {
  const { generations, popSize, capacity, vehicles } = params;
  let population = Array.from({ length: popSize }, () =>
    getRandomPermutation(customerIndices),
  );

  let bestPerm = [...population[0]];
  let bestEval = { distance: Infinity, fitness: Infinity, isFeasible: false };
  const history = [];

  for (let gen = 0; gen < generations; gen++) {
    const evaluated = population.map((perm) => {
      const routes = decodeChromosome(
        perm,
        locations,
        capacity,
        vehicles,
        distMatrix,
        depotIdx,
      );
      const evalRes = evaluateSolution(
        routes,
        distMatrix,
        depotIdx,
        locations,
        capacity,
      );
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

    const nextPop = [evaluated[0].perm];
    if (popSize > 1) nextPop.push(evaluated[1].perm);

    const poolSize = Math.max(1, Math.floor(popSize / 2));
    while (nextPop.length < popSize) {
      const parent1 = evaluated[Math.floor(Math.random() * poolSize)].perm;
      const parent2 = evaluated[Math.floor(Math.random() * poolSize)].perm;

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

      nextPop.push(
        Math.random() < 0.2 ? mutateRouteNeighborhood(child) : child,
      );
    }
    population = nextPop;
  }

  return {
    bestRoutes: decodeChromosome(
      bestPerm,
      locations,
      capacity,
      vehicles,
      distMatrix,
      depotIdx,
    ),
    bestDistance: bestEval.distance,
    isFeasible: bestEval.isFeasible,
    history,
    finalPopulation: population,
    bestPerm,
    bestEval,
  };
}

// --- ALGORITMA ARTIFICIAL BEE COLONY (ABC) ---
function runABC(
  locations,
  params,
  distMatrix,
  customerIndices,
  depotIdx,
  seedState = null,
) {
  const { generations, popSize, capacity, vehicles } = params;

  let foodSources = seedState?.population
    ? seedState.population.map((p) => [...p])
    : Array.from({ length: popSize }, () =>
        getRandomPermutation(customerIndices),
      );

  let fitnessCache = foodSources.map((perm) =>
    evaluateSolution(
      decodeChromosome(
        perm,
        locations,
        capacity,
        vehicles,
        distMatrix,
        depotIdx,
      ),
      distMatrix,
      depotIdx,
      locations,
      capacity,
    ),
  );

  let trialLimits = Array(popSize).fill(0);
  const maxTrials = 15;

  let bestPerm = seedState?.bestPerm
    ? [...seedState.bestPerm]
    : [...foodSources[0]];
  let bestEval = seedState?.bestEval
    ? { ...seedState.bestEval }
    : { ...fitnessCache[0] };
  const history = [];

  for (let gen = 0; gen < generations; gen++) {
    // 1. Employed Bees Phase
    for (let i = 0; i < popSize; i++) {
      const newPerm = mutateRouteNeighborhood(foodSources[i]);
      const newEval = evaluateSolution(
        decodeChromosome(
          newPerm,
          locations,
          capacity,
          vehicles,
          distMatrix,
          depotIdx,
        ),
        distMatrix,
        depotIdx,
        locations,
        capacity,
      );

      if (newEval.fitness < fitnessCache[i].fitness) {
        foodSources[i] = newPerm;
        fitnessCache[i] = newEval;
        trialLimits[i] = 0;
      } else {
        trialLimits[i]++;
      }
    }

    // 2. Onlooker Bees Phase
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
        decodeChromosome(
          newPerm,
          locations,
          capacity,
          vehicles,
          distMatrix,
          depotIdx,
        ),
        distMatrix,
        depotIdx,
        locations,
        capacity,
      );

      if (newEval.fitness < fitnessCache[selected].fitness) {
        foodSources[selected] = newPerm;
        fitnessCache[selected] = newEval;
        trialLimits[selected] = 0;
      } else {
        trialLimits[selected]++;
      }
    }

    // 3. Scout Bees Phase
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
          decodeChromosome(
            foodSources[i],
            locations,
            capacity,
            vehicles,
            distMatrix,
            depotIdx,
          ),
          distMatrix,
          depotIdx,
          locations,
          capacity,
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
    bestRoutes: decodeChromosome(
      bestPerm,
      locations,
      capacity,
      vehicles,
      distMatrix,
      depotIdx,
    ),
    bestDistance: bestEval.distance,
    isFeasible: bestEval.isFeasible,
    history,
  };
}

// --- MEMETIC HYBRID (60% GA + Memetic Local Search + 40% ABC = 100% Generasi) ---
function runHybrid(locations, params, distMatrix, customerIndices, depotIdx) {
  const { generations, popSize, capacity, vehicles } = params;
  const gaGen = Math.max(1, Math.floor(generations * 0.6));
  const abcGen = Math.max(1, generations - gaGen);

  // Tahap 1: Eksplorasi global dengan GA (60% generasi)
  const gaResult = runGA(
    locations,
    { ...params, generations: gaGen },
    distMatrix,
    customerIndices,
    depotIdx,
  );

  // Poles solusi terbaik hasil GA dengan Relocate + 1-1 Swap + 2-Opt
  const refinedGaRoutes = refineRoutesMemetic(
    gaResult.bestRoutes,
    distMatrix,
    depotIdx,
    locations,
    capacity,
  );
  const refinedGaEval = evaluateSolution(
    refinedGaRoutes,
    distMatrix,
    depotIdx,
    locations,
    capacity,
  );

  const rankedPop = gaResult.finalPopulation
    .map((perm) => ({
      perm,
      fit: evaluateSolution(
        decodeChromosome(
          perm,
          locations,
          capacity,
          vehicles,
          distMatrix,
          depotIdx,
        ),
        distMatrix,
        depotIdx,
        locations,
        capacity,
      ).fitness,
    }))
    .sort((a, b) => a.fit - b.fit)
    .map((item) => item.perm);

  const eliteCount = Math.min(5, popSize);
  for (let i = 0; i < eliteCount; i++) {
    const eliteRoutes = refineRoutesMemetic(
      decodeChromosome(
        rankedPop[i],
        locations,
        capacity,
        vehicles,
        distMatrix,
        depotIdx,
      ),
      distMatrix,
      depotIdx,
      locations,
      capacity,
    );
    rankedPop[i] = eliteRoutes.flat();
  }

  // Sinkronisasi seed ABC menggunakan Split Prins agar konsisten
  const seedPerm = refinedGaRoutes.flat();
  const seedDecodedEval = evaluateSolution(
    decodeChromosome(
      seedPerm,
      locations,
      capacity,
      vehicles,
      distMatrix,
      depotIdx,
    ),
    distMatrix,
    depotIdx,
    locations,
    capacity,
  );

  // Tahap 2: Eksploitasi lokal lanjutan dengan ABC (40% sisa generasi)
  const abcResult = runABC(
    locations,
    { ...params, generations: abcGen },
    distMatrix,
    customerIndices,
    depotIdx,
    {
      population: rankedPop,
      bestPerm: seedPerm,
      bestEval: seedDecodedEval,
    },
  );

  // Pemolesan akhir (Final Polishing) pada rute terbaik ABC
  const polishedAbcRoutes = refineRoutesMemetic(
    abcResult.bestRoutes,
    distMatrix,
    depotIdx,
    locations,
    capacity,
  );
  const polishedAbcEval = evaluateSolution(
    polishedAbcRoutes,
    distMatrix,
    depotIdx,
    locations,
    capacity,
  );

  // Pilih solusi terbaik mutlak dari seluruh tahapan Hybrid
  const candidates = [
    { routes: gaResult.bestRoutes, evalRes: gaResult.bestEval },
    { routes: refinedGaRoutes, evalRes: refinedGaEval },
    {
      routes: abcResult.bestRoutes,
      evalRes: evaluateSolution(
        abcResult.bestRoutes,
        distMatrix,
        depotIdx,
        locations,
        capacity,
      ),
    },
    { routes: polishedAbcRoutes, evalRes: polishedAbcEval },
  ].sort((a, b) => a.evalRes.fitness - b.evalRes.fitness);

  const winner = candidates[0];

  const history = [
    ...gaResult.history,
    ...abcResult.history.map((h, i) => ({
      generation: gaGen + i + 1,
      fitness:
        i === abcResult.history.length - 1
          ? Number(winner.evalRes.distance.toFixed(2))
          : Math.min(h.fitness, Number(refinedGaEval.distance.toFixed(2))),
    })),
  ];

  return {
    bestRoutes: winner.routes,
    bestDistance: winner.evalRes.distance,
    isFeasible: winner.evalRes.isFeasible,
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
    const gaRes = runGA(
      locations,
      params,
      distMatrix,
      customerIndices,
      depotIdx,
    );
    const t1 = performance.now();
    const abcRes = runABC(
      locations,
      params,
      distMatrix,
      customerIndices,
      depotIdx,
    );
    const t2 = performance.now();
    const hybridRes = runHybrid(
      locations,
      params,
      distMatrix,
      customerIndices,
      depotIdx,
    );
    const t3 = performance.now();

    self.postMessage({
      status: "SUCCESS",
      isBenchmark: true,
      data: {
        GA: {
          ...gaRes,
          time: (t1 - t0).toFixed(1),
          executionTime: (t1 - t0).toFixed(1),
        },
        ABC: {
          ...abcRes,
          time: (t2 - t1).toFixed(1),
          executionTime: (t2 - t1).toFixed(1),
        },
        HYBRID: {
          ...hybridRes,
          time: (t3 - t2).toFixed(1),
          executionTime: (t3 - t2).toFixed(1),
        },
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
    result = runHybrid(
      locations,
      params,
      distMatrix,
      customerIndices,
      depotIdx,
    );
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
