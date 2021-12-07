// Hist APRS : 620, 618.5

let init_invest = 1000;
let for_days = 30;
let init_apr = 619.67;
let harvest_fees = 0.6;
let apr_down = true;

document.querySelector('#init_invest').value = init_invest;
document.querySelector('#init_invest').addEventListener('change', (e) => {
  init_invest = parseInt(e.target.value);
  updateChart();
});
document.querySelector('#for_days').value = for_days;
document.querySelector('#for_days').addEventListener('change', (e) => {
  for_days = parseInt(e.target.value);
  updateChart();
});
document.querySelector('#init_apr').value = init_apr;
document.querySelector('#init_apr').addEventListener('change', (e) => {
  init_apr = parseFloat(e.target.value);
  updateChart();
});
document.querySelector('#harvest_fees').value = harvest_fees;
document.querySelector('#harvest_fees').addEventListener('change', (e) => {
  harvest_fees = parseFloat(e.target.value);
  updateChart();
});
document.querySelector('#apr_down').checked = apr_down;
document.querySelector('#apr_down').addEventListener('change', (e) => {
  apr_down = e.target.checked;
  updateChart();
});

function updateChart() {
  chart.data = initChart();
  chart.update();
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
  if (apr_down) {
    return Math.max(25, current_apr * 0.97);
  } else {
    return current_apr;
  }
}

function compoundEvery(days) {
  const compound = [];
  let current = init_invest;
  let apr = init_apr;
  let accu = 0;
  compound.push(current);

  for (let day = 1; day < for_days; day++) {
    const daily_apr = apr / 365;
    const daily_gain = (daily_apr / 100) * current;
    accu += daily_gain;

    if (day % days == 0) {
      current += accu;
      current -= harvest_fees;
      accu = 0;
    }

    compound.push(current);
    apr = getNextAPR(apr);
  }

  // Harvest for last day
  if (accu != 0) {
    compound[for_days - 1] += accu - harvest_fees;
  }
  return compound;
}

function initChart() {
  const data = {
    labels: [],
    datasets: [
      {
        label: `Harvest every day`,
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
    const last_max = data.datasets[data.datasets.length - 1].data[for_days - 1];
    const current_compound = compoundEvery(current_compound_every);

    if (current_compound[for_days - 1] > last_max + 2) {
      data.datasets.push({
        label: `Harvest every ${current_compound_every} days`,
        data: current_compound,
        borderColor: getRandomColor(),
        fill: false,
        stepped: false,
        type: 'line',
      });
    } else {
      break;
    }
  }

  let prev_apr = init_apr;
  data.datasets.push({
    label: `APR (%)`,
    data: Array.from(Array(for_days).keys()).map((_, i) => {
      prev_apr = i === 0 ? init_apr : getNextAPR(prev_apr);
      return prev_apr;
    }),
    borderColor: 'red',
    fill: false,
    stepped: false,
    type: 'line',
  });

  data.labels = Array.from(Array(for_days).keys()).map((day) => `Day ${day + 1}`);

  const last_max = data.datasets[data.datasets.length - 2].data[for_days - 1].toFixed(0);
  const result_percent = (((last_max - init_invest) / init_invest) * 100).toFixed(1);
  let innerHTML = 'Harvest every XXX day(s) for YYY days : ZZZ';
  document.querySelector('#results').innerHTML = innerHTML
    .replace('XXX', data.datasets.length - 1)
    .replace('YYY', for_days)
    .replace('ZZZ', `${last_max} (+ ${result_percent}%)`);

  addToHist(data.datasets.length - 1, last_max, result_percent);

  return data;
}

const table = document.querySelector('#hist');
function addToHist(compound, last_max, result_percent) {
  console.log(last_max);
  const row = table.insertRow(1);
  row.insertCell(0).innerHTML = init_invest;
  row.insertCell(1).innerHTML = init_apr;
  row.insertCell(2).innerHTML = apr_down ? 'yes' : 'no';
  row.insertCell(3).innerHTML = `${for_days} day${for_days > 1 ? 's' : ''}`;
  row.insertCell(4).innerHTML = `${compound} day${compound > 1 ? 's' : ''}`;
  row.insertCell(5).innerHTML = harvest_fees;
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
