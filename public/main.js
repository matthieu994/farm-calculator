// Hist APRS : 620, 618.5

let init_invest = 1000;
let for_days = 30;
let init_apr = 619.67;
let harvest_fees = 0.6;

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

function updateChart() {
  myChart.data = initChart();
  myChart.update();
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
  return Math.max(25, current_apr * 0.97);
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
        label: `Compound every 1 day`,
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
        label: `Compound every ${current_compound_every} days`,
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
      return `${prev_apr}`;
    }),
    borderColor: 'red',
    fill: false,
    stepped: false,
    type: 'line',
  });

  data.labels = Array.from(Array(for_days).keys()).map((day) => `Day ${day + 1}`);

  let innerHTML = 'Compound every XXX day(s)';
  document.querySelector('#compound').innerHTML = innerHTML.replace(
    'XXX',
    data.datasets.length - 1
  );

  innerHTML = 'Max value after XXX days : YYY';
  const last_max = data.datasets[data.datasets.length - 2].data[for_days - 1].toFixed(0);
  document.querySelector('#last_max').innerHTML = innerHTML
    .replace('XXX', for_days)
    .replace(
      'YYY',
      `${last_max} (+ ${(((last_max - init_invest) / init_invest) * 100).toFixed(1)}%)`
    );

  return data;
}

initChart();

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
const myChart = new Chart(document.getElementById('myChart'), config);
