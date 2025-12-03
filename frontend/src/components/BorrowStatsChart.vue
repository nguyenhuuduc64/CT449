<template>
  <div class="chart-container">
    <h3>{{ title }}</h3>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  chartData: {
    type: Object,
    required: true
  },
  chartType: {
    type: String,
    default: 'bar'
  }
});

const chartCanvas = ref(null);
let chart = null;

const renderChart = () => {
  if (chart) {
    chart.destroy();
  }

  if (chartCanvas.value) {
    const ctx = chartCanvas.value.getContext('2d');
    chart = new Chart(ctx, {
      type: props.chartType,
      data: props.chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: props.title
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
};

onMounted(renderChart);
onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
  }
});

watch(() => props.chartData, () => {
  renderChart();
}, { deep: true });
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

canvas {
  max-height: 400px;
}
</style>
