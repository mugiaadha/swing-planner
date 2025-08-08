
// helpers
const $ = (id) => document.getElementById(id);
const fmt = (v) => (typeof v === "number" ? v.toLocaleString("id-ID") : v);

// Sinkronisasi jumlah input harga per stage setiap kali jumlah tahap diubah
function syncStageInputs() {
  const stages = Math.max(1, Number($("inputStages").value) || 3);
  const rows = Array.from(document.querySelectorAll("#stocksList .stock-row"));
  rows.forEach((row) => {
    const price = Number(row.querySelector(".s-price").value) || 0;
    const pricesWrap = row.querySelector(".stage-prices");
    const oldInputs = Array.from(pricesWrap.querySelectorAll(".s-stage-price"));
    const oldValues = oldInputs.map((inp) => Number(inp.value) || price);
    pricesWrap.innerHTML = "";
    if (stages > 5) {
      for (let i = 0; i < stages; i++) {
        const rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        rowDiv.style.alignItems = "center";
        rowDiv.style.marginBottom = "2px";
        const label = document.createElement("span");
        label.className = "stage-label";
        label.textContent = `S${i + 1}: `;
        rowDiv.appendChild(label);
        const inp = document.createElement("input");
        inp.type = "number";
        inp.className = "s-stage-price";
        inp.placeholder = `Harga S${i + 1}`;
        inp.style.width = "70px";
        inp.style.marginLeft = "2px";
        inp.value = oldValues[i] !== undefined ? oldValues[i] : "";
        rowDiv.appendChild(inp);
        pricesWrap.appendChild(rowDiv);
      }
    } else {
      for (let i = 0; i < stages; i++) {
        const label = document.createElement("span");
        label.className = "stage-label";
        label.textContent = `S${i + 1}: `;
        pricesWrap.appendChild(label);
        const inp = document.createElement("input");
        inp.type = "number";
        inp.className = "s-stage-price";
        inp.placeholder = `Harga S${i + 1}`;
        inp.style.width = "70px";
        inp.style.marginLeft = "2px";
        inp.value = oldValues[i] !== undefined ? oldValues[i] : "";
        pricesWrap.appendChild(inp);
        if (i < stages - 1) {
          pricesWrap.appendChild(document.createTextNode(" "));
        }
      }
    }
  });
}

// Event listener untuk inputStages
$("inputStages").addEventListener("change", syncStageInputs);
$("inputStages").addEventListener("input", syncStageInputs);

function createStockRow(name = "CDIA", price = 1575, weight = 0, stagePrices = []) {
  const t = document.getElementById("stockTemplate").content.cloneNode(true);
  const el = t.querySelector(".stock-row");
  el.querySelector(".s-name").value = name;
  el.querySelector(".s-price").value = price;
  el.querySelector(".s-weight").value = weight;
  // Add per-stage price inputs
  const stages = Math.max(1, Number($("inputStages").value) || 3);
  const pricesWrap = el.querySelector(".stage-prices");
  pricesWrap.innerHTML = "";
  if (stages > 5) {
    for (let i = 0; i < stages; i++) {
      const rowDiv = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.style.alignItems = "center";
      rowDiv.style.marginBottom = "2px";
      const label = document.createElement("span");
      label.className = "stage-label";
      label.textContent = `S${i + 1}: `;
      rowDiv.appendChild(label);
      const inp = document.createElement("input");
      inp.type = "number";
      inp.className = "s-stage-price";
      inp.placeholder = `Harga S${i + 1}`;
      inp.style.width = "70px";
      inp.style.marginLeft = "2px";
      inp.value = stagePrices[i] !== undefined ? stagePrices[i] : "";
      rowDiv.appendChild(inp);
      pricesWrap.appendChild(rowDiv);
    }
  } else {
    for (let i = 0; i < stages; i++) {
      const label = document.createElement("span");
      label.className = "stage-label";
      label.textContent = `S${i + 1}: `;
      pricesWrap.appendChild(label);
      const inp = document.createElement("input");
      inp.type = "number";
      inp.className = "s-stage-price";
      inp.placeholder = `Harga S${i + 1}`;
      inp.style.width = "70px";
      inp.style.marginLeft = "2px";
      inp.value = stagePrices[i] !== undefined ? stagePrices[i] : "";
      pricesWrap.appendChild(inp);
      if (i < stages - 1) {
        pricesWrap.appendChild(document.createTextNode(" "));
      }
    }
  }
  el.querySelector(".remove").addEventListener("click", () => {
    el.remove();
  });
  document.getElementById("stocksList").appendChild(el);
}

document.getElementById("btnAddStock").addEventListener("click", () => createStockRow("", "", 0));
document.getElementById("btnReset").addEventListener("click", () => {
  if (!confirm("Reset semua input?")) return;
  $("stocksList").innerHTML = "";
  createStockRow("CDIA", 1575, 0);
  createStockRow("BREN", 8000, 0);
  createStockRow("PTRO", 3710, 0);
  createStockRow("CUAN", 1575, 0);
});

// initial
createStockRow("CDIA", 1575, 0);
createStockRow("BREN", 8000, 0);
createStockRow("PTRO", 3710, 0);
createStockRow("CUAN", 1575, 0);

// toggle custom alloc
$("allocMode").addEventListener("change", (e) => {
  $("customAllocWrap").style.display = e.target.value === "custom" ? "block" : "none";
});

// get stocks array
function readStocks() {
  const rows = Array.from(document.querySelectorAll("#stocksList .stock-row"));
  return rows
    .map((r) => {
      const stagePrices = Array.from(r.querySelectorAll(".s-stage-price")).map((i) => Number(i.value) || 0);
      return {
        name: r.querySelector(".s-name").value.trim() || "UNK",
        price: Number(r.querySelector(".s-price").value) || 0,
        weight: Number(r.querySelector(".s-weight").value) || 0,
        stagePrices,
      };
    })
    .filter((s) => s.price > 0);
}

// compute plan
function computePlan() {
  const modal = Number($("inputModal").value) || 0;
  const lotSize = Number($("inputLotSize").value) || 100;
  const days = Number($("inputDays").value) || 90;
  const stages = Math.max(1, Number($("inputStages").value) || 3);
  const stage0Lots = Math.max(0, Number($("stage0_lot").value) || 1);
  const allocMode = $("allocMode").value;
  let customPercents = [];

  if (allocMode === "custom") {
    const raw = ($("customAlloc").value || "").trim();
    if (!raw) {
      alert("Masukkan persen custom untuk tiap tahap (jumlah = 100)");
      return null;
    }
    customPercents = raw.split(",").map((x) => Number(x.trim()) || 0);
    if (customPercents.length !== stages) {
      alert("Jumlah persen custom harus sesuai jumlah tahap yang kamu pilih.");
      return null;
    }
    const sum = customPercents.reduce((a, b) => a + b, 0);
    if (Math.round(sum) !== 100) {
      alert("Total persen custom harus 100%. Saat ini total = " + sum + "%");
      return null;
    }
  }

  const stocks = readStocks();
  if (stocks.length === 0) {
    alert("Tambahkan minimal 1 saham dengan harga > 0");
    return null;
  }

  // compute money reserved for stage0
  let stage0Cost = 0;
  stocks.forEach((s) => (stage0Cost += stage0Lots * lotSize * s.price));

  if (stage0Cost > modal) {
    alert("Modal tidak cukup untuk stage0. Kurangi stage0 lots atau tambah modal.");
    return null;
  }

  // remaining modal for stages 1..stages
  let remaining = modal - stage0Cost;

  // stage allocation in money
  let stageAllocations = [];
  if (allocMode === "equal") {
    // equal share across stages
    const per = Math.floor(remaining / stages);
    for (let i = 0; i < stages; i++) stageAllocations.push(per);
    const rem = remaining - per * stages;
    if (rem > 0) stageAllocations[stages - 1] += rem;
  } else {
    stageAllocations = customPercents.map((p) => Math.floor((remaining * p) / 100));
    const allocated = stageAllocations.reduce((a, b) => a + b, 0);
    const rem = remaining - allocated;
    if (rem > 0) stageAllocations[stageAllocations.length - 1] += rem;
  }

  let useWeights = stocks.some((s) => s.weight > 0);
  let totalWeight = useWeights ? stocks.reduce((a, b) => a + (b.weight || 0), 0) : null;
  const totalPrice = stocks.reduce((a, b) => a + b.price, 0);

  const plan = {};
  stocks.forEach((s) => {
    plan[s.name] = {
      price: s.price,
      stage0: stage0Lots,
      stages: Array.from({ length: stages }, () => 0),
      investedStage0: stage0Lots * lotSize * s.price,
      stagePrices: s.stagePrices,
    };
  });

  for (let si = 0; si < stages; si++) {
    const moneyForStage = stageAllocations[si] || 0;
    let shares = stocks.map((s) => {
      let share = 0;
      if (useWeights) {
        if (totalWeight === 0) share = 1 / stocks.length;
        else share = s.weight / totalWeight;
      } else {
        share = s.price / totalPrice;
      }
      return share;
    });
    let stageLots = stocks.map((s, idx) => {
      const allocatedMoney = Math.floor(moneyForStage * shares[idx]);
      const lotCost = lotSize * (s.stagePrices[si] || s.price);
      const lotsCanBuy = Math.floor(allocatedMoney / lotCost);
      return lotsCanBuy;
    });
    let usedMoney = stageLots.reduce(
      (acc, lots, idx) => acc + lots * lotSize * (stocks[idx].stagePrices[si] || stocks[idx].price),
      0
    );
    let leftover = moneyForStage - usedMoney;
    while (true) {
      let buyIdx = -1;
      let minCost = Infinity;
      for (let i = 0; i < stocks.length; i++) {
        const costLot = lotSize * (stocks[i].stagePrices[si] || stocks[i].price);
        if (costLot <= leftover && costLot < minCost) {
          minCost = costLot;
          buyIdx = i;
        }
      }
      if (buyIdx === -1) break;
      stageLots[buyIdx] += 1;
      leftover -= minCost;
    }
    stocks.forEach((s, idx) => {
      plan[s.name].stages[si] = stageLots[idx];
      plan[s.name].investedStage0 = plan[s.name].investedStage0 || 0;
    });
  }

  let totals = {
    investedStage0: 0,
    investedStages: Array.from({ length: stages }, () => 0),
    totalInvested: 0,
  };

  stocks.forEach((s, idx) => {
    const entry = plan[s.name];
    const invest0 = entry.stage0 * lotSize * s.price;
    totals.investedStage0 += invest0;
    let sumStages = 0;
    entry.stages.forEach((lots, si) => {
      const cost = lots * lotSize * (entry.stagePrices[si] || s.price);
      totals.investedStages[si] += cost;
      sumStages += cost;
    });
    entry.totalLots = entry.stage0 + entry.stages.reduce((a, b) => a + b, 0);
    entry.totalInvested = invest0 + sumStages;
    entry.avgPricePerShare = entry.totalLots > 0 ? Math.round(entry.totalInvested / (entry.totalLots * lotSize)) : 0;
    totals.totalInvested += entry.totalInvested;
  });

  const leftoverFinal = modal - totals.totalInvested;

  return {
    plan,
    stocks,
    totals,
    stageAllocations,
    leftoverFinal,
    stages,
    lotSize,
    modal,
  };
}

function renderResult(obj) {
  const wrap = $("resultWrap");
  if (!obj) {
    wrap.innerHTML = "";
    return;
  }
  const { plan, stocks, totals, stageAllocations, leftoverFinal, stages, lotSize, modal } = obj;
  let html = `<div class="card"><div class="small muted">Modal awal: Rp ${fmt(modal)}</div>
    <table><thead><tr><th>Saham</th><th>Harga</th><th>Stage0 (lot)</th>`;
  for (let s = 0; s < stages; s++) html += `<th>Stage ${s + 1} (lot)</th>`;
  html += `<th>Total Lot</th><th>Avg Price/lembar</th><th>Total Invest (Rp)</th></tr></thead><tbody>`;
  for (const s of stocks) {
    const row = plan[s.name];
    html += `<tr>
      <td>${s.name}</td>
      <td>Rp ${fmt(s.price)}</td>
      <td>${row.stage0}</td>`;
    for (let i = 0; i < stages; i++) html += `<td>${row.stages[i] || 0}</td>`;
    html += `<td>${row.totalLots}</td>
      <td>Rp ${fmt(row.avgPricePerShare)}</td>
      <td>Rp ${fmt(row.totalInvested)}</td>
    </tr>`;
  }
  html += `</tbody></table>
    <div style="margin-top:12px"><strong>Ringkasan:</strong>
      <div class="small">Investasi Stage0: Rp ${fmt(totals.investedStage0)}</div>`;
  stageAllocations.forEach((a, idx) => {
    html += `<div class="small">Alokasi Stage ${idx + 1}: Rp ${fmt(a)} (terpakai: Rp ${fmt(totals.investedStages[idx] || 0)})</div>`;
  });
  html += `<div class="small">Total invested: Rp ${fmt(totals.totalInvested)}</div>
           <div class="small">Sisa modal (final): Rp ${fmt(leftoverFinal)}</div>
           </div>
    </div>`;
  wrap.innerHTML = html;
}

function exportCSV(obj) {
  if (!obj) return;
  const { plan, stocks, totals, stageAllocations, leftoverFinal, stages, lotSize } = obj;
  let rows = [];
  let header = ["Saham", "Harga", "Stage0(lot)"];
  for (let i = 0; i < stages; i++) header.push(`Stage${i + 1}(lot)`);
  header.push("TotalLot", "AvgPricePerShare", "TotalInvested");
  rows.push(header.join(","));
  stocks.forEach((s) => {
    const p = plan[s.name];
    const row = [s.name, s.price, p.stage0];
    for (let i = 0; i < stages; i++) row.push(p.stages[i] || 0);
    row.push(p.totalLots, p.avgPricePerShare, p.totalInvested);
    rows.push(row.join(","));
  });
  rows.push("");
  rows.push(`Summary,Modal awal,${$("inputModal").value}`);
  rows.push(`Invested Stage0,${totals.investedStage0}`);
  stageAllocations.forEach((a, idx) =>
    rows.push(`Allocated Stage ${idx + 1},${a},Used ${totals.investedStages[idx] || 0}`)
  );
  rows.push(`Total Invested,${totals.totalInvested}`);
  rows.push(`Leftover,${leftoverFinal}`);
  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trader_plan.csv";
  a.click();
  URL.revokeObjectURL(url);
}

$("btnCompute").addEventListener("click", () => {
  const res = computePlan();
  if (res) {
    renderResult(res);
    let saveDaysVal = $("saveDays").value;
    let saveDays = 0;
    if (saveDaysVal === "durasi") {
      saveDays = Number($("inputDays").value) || 0;
    } else {
      saveDays = Number(saveDaysVal) || 0;
    }
    if (saveDays > 0) {
      const data = {
        modal: $("inputModal").value,
        lotSize: $("inputLotSize").value,
        days: $("inputDays").value,
        stages: $("inputStages").value,
        stage0: $("stage0_lot").value,
        allocMode: $("allocMode").value,
        customAlloc: $("customAlloc").value,
        stocks: readStocks(),
        ts: Date.now(),
        exp: Date.now() + saveDays * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem("traderPlan", JSON.stringify(data));
    } else {
      localStorage.removeItem("traderPlan");
    }
  }
});

$("btnExport").addEventListener("click", () => {
  const res = computePlan();
  if (res) exportCSV(res);
});

$("customAlloc").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("btnCompute").click();
});

window.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("traderPlan");
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data.exp && Date.now() < data.exp) {
        $("inputModal").value = data.modal || 60000000;
        $("inputLotSize").value = data.lotSize || 100;
        $("inputDays").value = data.days || 90;
        $("inputStages").value = data.stages || 3;
        $("stage0_lot").value = data.stage0 || 1;
        $("allocMode").value = data.allocMode || "equal";
        $("customAlloc").value = data.customAlloc || "";
        $("stocksList").innerHTML = "";
        (data.stocks || []).forEach((s) => createStockRow(s.name, s.price, s.weight, s.stagePrices));
        $("customAllocWrap").style.display = data.allocMode === "custom" ? "block" : "none";
        const left = Math.ceil((data.exp - Date.now()) / (24 * 60 * 60 * 1000));
        $("saveDays").value = left > 0 ? left : 7;
        const res = computePlan();
        if (res) renderResult(res);
      } else {
        localStorage.removeItem("traderPlan");
      }
    } catch { }
  }
});
