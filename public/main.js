// Hist APRS : 620, 618.5

const inputs = {
  init_invest: 1000,
  for_days: 30,
  init_apr: 619.67,
  harvest_fees: 0.6,
  apr_down: true,
};
loadFromStorage();

document.querySelector('#init_invest').value = inputs.init_invest;
document.querySelector('#init_invest').addEventListener('change', (e) => {
  inputs.init_invest = parseInt(e.target.value);
  updateChart();
});
document.querySelector('#for_days').value = inputs.for_days;
document.querySelector('#for_days').addEventListener('change', (e) => {
  inputs.for_days = parseInt(e.target.value);
  updateChart();
});
document.querySelector('#init_apr').value = inputs.init_apr;
document.querySelector('#init_apr').addEventListener('change', (e) => {
  inputs.init_apr = parseFloat(e.target.value);
  updateChart();
});
document.querySelector('#harvest_fees').value = inputs.harvest_fees;
document.querySelector('#harvest_fees').addEventListener('change', (e) => {
  inputs.harvest_fees = parseFloat(e.target.value);
  updateChart();
});
document.querySelector('#apr_down').checked = inputs.apr_down;
document.querySelector('#apr_down').addEventListener('change', (e) => {
  inputs.apr_down = e.target.checked;
  updateChart();
});

function updateChart() {
  harvest_step = (inputs.init_invest * inputs.init_apr) / (365 * 2) / 100;
  saveToStorage();
  chart.data = initChart();
  chart.update();
}

function saveToStorage() {
  ['init_invest', 'for_days', 'init_apr', 'harvest_fees', 'apr_down'].forEach((item) => {
    localStorage.setItem(item, inputs[item]);
  });
}

function loadFromStorage() {
  ['init_invest', 'for_days', 'init_apr', 'harvest_fees', 'apr_down'].forEach((item) => {
    const value = localStorage.getItem(item);

    if (value !== null) {
      if (value.includes('.')) inputs[item] = parseFloat(value);
      else if (['true', 'false'].includes(value)) inputs[item] = value === 'true';
      else inputs[item] = parseInt(value);
    }
  });
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getNextAPR(current_apr) {
  if (inputs.apr_down) {
    return Math.max(25, current_apr * 0.97);
  } else {
    return current_apr;
  }
}

// For each day : check 2x if rewards are interesting
// to harvest, and add a line for this "step reward"
let harvest_step = (inputs.init_invest * inputs.init_apr) / (365 * 2) / 100;

function compoundEvery(harvest_mult) {
  const compound = [];

  let current = inputs.init_invest;
  let apr = inputs.init_apr;
  let accu = 0;
  compound.push(current);

  for (let day = 1; day < inputs.for_days * 2; day++) {
    const mid_daily_apr = apr / (365 * 2);
    const mid_daily_gain = (mid_daily_apr / 100) * current;
    accu += mid_daily_gain;

    if (accu >= harvest_step * harvest_mult) {
      current += accu - inputs.harvest_fees;
      accu = 0;
    }
    compound.push(current);

    apr = getNextAPR(apr);
  }

  // Harvest for last day
  if (accu !== 0) {
    compound[compound.length - 1] += accu - inputs.harvest_fees;
  }
  return compound;
}

function initChart() {
  const data = {
    labels: [],
    datasets: [
      {
        label: `Harvest every ${harvest_step.toFixed(2) * 1}`,
        data: compoundEvery(1),
        borderColor: getRandomColor(),
        fill: false,
        stepped: false,
        type: 'line',
      },
    ],
  };

  while (1) {
    const current_compound_every = data.datasets.length + 1;
    const last_data = data.datasets[data.datasets.length - 1].data;
    const last_max = last_data[last_data.length - 1];
    const current_compound = compoundEvery(current_compound_every);

    if (current_compound[current_compound.length - 1] >= last_max) {
      data.datasets.push({
        label: `Harvest every ${harvest_step.toFixed(2) * current_compound_every}`,
        data: current_compound,
        borderColor: getRandomColor(),
        fill: false,
        stepped: false,
        type: 'line',
      });
    } else {
      // data.datasets.push({
      //   label: `Harvest every ${harvest_step.toFixed(2) * current_compound_every}`,
      //   data: current_compound,
      //   borderColor: getRandomColor(),
      //   fill: false,
      //   stepped: false,
      //   type: 'line',
      // });
      break;
    }

    // if (current_compound_every >= 10) {
    //   break;
    // }
  }

  // Set APR line
  let prev_apr = inputs.init_apr;
  data.datasets.push({
    label: `APR (%)`,
    data: Array.from(Array(inputs.for_days * 2).keys()).map((_, i) => {
      prev_apr = i === 0 ? inputs.init_apr : getNextAPR(prev_apr);
      return prev_apr;
    }),
    borderColor: 'red',
    fill: false,
    stepped: false,
    type: 'line',
  });

  // Set bottom labels
  data.labels = Array.from(Array(inputs.for_days * 2).keys()).map(
    (day) => `Day ${day / 2}`
  );

  const last_data = data.datasets[data.datasets.length - 2].data;
  const last_max = last_data[last_data.length - 1].toFixed(0);
  const result_percent = (
    ((last_max - inputs.init_invest) / inputs.init_invest) *
    100
  ).toFixed(1);
  let innerHTML = 'XXX$ for YYY days : ZZZ';
  document.querySelector('#results').innerHTML = innerHTML
    .replace('XXX', data.datasets[data.datasets.length - 2].label)
    .replace('YYY', inputs.for_days)
    .replace('ZZZ', `${last_max} (+ ${result_percent}%)`);

  addToHist(data.datasets.length - 1, last_max, result_percent);

  return data;
}

const table = document.querySelector('#hist');
function addToHist(compound, last_max, result_percent) {
  const row = table.insertRow(1);
  row.insertCell(0).innerHTML = inputs.init_invest;
  row.insertCell(1).innerHTML = inputs.init_apr;
  row.insertCell(2).innerHTML = inputs.apr_down ? 'yes' : 'no';
  row.insertCell(3).innerHTML = `${inputs.for_days} day${inputs.for_days > 1 ? 's' : ''}`;
  row.insertCell(4).innerHTML = `${compound} day${compound > 1 ? 's' : ''}`;
  row.insertCell(5).innerHTML = inputs.harvest_fees;
  row.insertCell(6).innerHTML = last_max;
  row.insertCell(7).innerHTML = `${result_percent}%`;
}

const config = {
  type: 'line',
  data: initChart(),
  options: {
    showTooltips: false,
    tooltips: { enabled: false },
    hover: { mode: null },
    responsive: true,
    interaction: {
      intersect: false,
      axis: 'x',
    },
  },
};
const chart = new Chart(document.getElementById('chart'), config);
