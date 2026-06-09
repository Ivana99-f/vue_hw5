<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  prices: {
    type: Array,
    required: true
  },
  highlights: {
    type: Array,
    required: true
  }
})

const canvasRef = ref(null)
let chart = null

function renderChart() {
  if (!chart) {
    return
  }

  const highlightSet = new Set(props.highlights)
  const labels = props.prices.map((item) => `${item.year}/${item.month}`)
  const prices = props.prices.map((item) => item.price)
  const radii = props.prices.map((item) => (highlightSet.has(`${item.year}-${item.month}`) ? 8 : 4))
  const hoverRadii = props.prices.map((item) => (highlightSet.has(`${item.year}-${item.month}`) ? 10 : 6))
  const pointColors = props.prices.map((item) => (highlightSet.has(`${item.year}-${item.month}`) ? '#ffb347' : '#2f2a24'))

  chart.data.labels = labels
  chart.data.datasets[0].data = prices
  chart.data.datasets[0].pointRadius = radii
  chart.data.datasets[0].pointHoverRadius = hoverRadii
  chart.data.datasets[0].pointBackgroundColor = pointColors
  chart.update()
}

onMounted(() => {
  const context = canvasRef.value.getContext('2d')

  chart = new Chart(context, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: '甘藷價格',
          data: [],
          borderColor: '#8f3f08',
          backgroundColor: 'rgba(255, 190, 117, 0.18)',
          pointBackgroundColor: '#2f2a24',
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          intersect: false,
          backgroundColor: 'rgba(21, 17, 13, 0.95)',
          titleColor: '#f7efe6',
          bodyColor: '#f7efe6'
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#64584d'
          }
        },
        y: {
          grid: {
            color: 'rgba(88, 70, 51, 0.12)'
          },
          ticks: {
            color: '#64584d'
          }
        }
      }
    }
  })

  renderChart()
})

watch(
  () => [props.prices, props.highlights],
  () => {
    renderChart()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy()
    chart = null
  }
})
</script>

<template>
  <div class="chart-wrap">
    <canvas ref="canvasRef" />
  </div>
</template>