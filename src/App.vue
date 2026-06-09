<script setup>
import { computed, onMounted, ref } from 'vue'
import ModeTabs from './components/ModeTabs.vue'
import TrendChart from './components/TrendChart.vue'
import { initialInflation, initialPrices } from './data'

const years = Array.from({ length: 11 }, (_, index) => 2016 + index)
const months = Array.from({ length: 12 }, (_, index) => index + 1)

const activeTab = ref('observer')
const allPrices = ref([...initialPrices])
const inflationRates = ref(
  initialInflation.reduce((accumulator, row) => {
    accumulator[row.year] = row.index_val
    return accumulator
  }, {})
)
const observerResults = ref(null)
const searchYear = ref('all')
const searchMonth = ref('all')
const formYear = ref(2016)
const formMonth = ref(1)
const formPrice = ref('')
const statusMessage = ref('')

const visibleObserverData = computed(() => observerResults.value ?? allPrices.value)
const chartHighlights = computed(() => {
  return (observerResults.value ?? []).map((item) => `${item.year}-${item.month}`)
})

const inflationInfo = computed(() => {
  if (searchYear.value === 'all') {
    return null
  }

  const selectedYear = Number(searchYear.value)
  const baseIndex = inflationRates.value[2016]
  const selectedIndex = inflationRates.value[selectedYear]

  if (!baseIndex || !selectedIndex) {
    return null
  }

  const rate = ((selectedIndex / baseIndex) - 1) * 100

  return {
    year: selectedYear,
    rate: rate.toFixed(1)
  }
})

function formatCurrency(value) {
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function formatMonth(month) {
  return `${month} 月`
}

async function loadPrices() {
  try {
    const response = await fetch('/api/prices')

    if (!response.ok) {
      throw new Error('API unavailable')
    }

    allPrices.value = await response.json()
  } catch {
    allPrices.value = [...initialPrices]
  }
}

async function loadInflationRates() {
  try {
    const response = await fetch('/api/inflation')

    if (!response.ok) {
      throw new Error('API unavailable')
    }

    const rows = await response.json()
    inflationRates.value = rows.reduce((accumulator, row) => {
      accumulator[row.year] = row.index_val
      return accumulator
    }, {})
  } catch {
    inflationRates.value = initialInflation.reduce((accumulator, row) => {
      accumulator[row.year] = row.index_val
      return accumulator
    }, {})
  }
}

async function searchPrices() {
  if (!window.location.hostname || window.location.hostname.includes('github.io')) {
    const filtered = initialPrices.filter((item) => {
      const matchesYear = searchYear.value === 'all' || String(item.year) === searchYear.value
      const matchesMonth = searchMonth.value === 'all' || String(item.month) === searchMonth.value
      return matchesYear && matchesMonth
    })

    observerResults.value = filtered
    statusMessage.value = filtered.length === 0 ? '查無資料，已自動帶入新增表單。' : ''

    if (filtered.length === 0) {
      if (searchYear.value !== 'all') {
        formYear.value = Number(searchYear.value)
      }

      if (searchMonth.value !== 'all') {
        formMonth.value = Number(searchMonth.value)
      }
    }

    return
  }

  const url = new URL('/api/prices/search', window.location.origin)

  url.searchParams.set('year', searchYear.value)
  url.searchParams.set('month', searchMonth.value)

  const response = await fetch(url)
  const results = await response.json()

  if (results.length === 0) {
    window.alert('查無資料，已自動帶入新增表單。')

    if (searchYear.value !== 'all') {
      formYear.value = Number(searchYear.value)
    }

    if (searchMonth.value !== 'all') {
      formMonth.value = Number(searchMonth.value)
    }

    observerResults.value = null
    statusMessage.value = '查無資料，已自動帶入新增表單。'
    return
  }

  statusMessage.value = ''
  observerResults.value = results
}

function clearSearch() {
  searchYear.value = 'all'
  searchMonth.value = 'all'
  observerResults.value = null
  statusMessage.value = ''
}

async function savePrice() {
  const year = Number(formYear.value)
  const month = Number(formMonth.value)
  const price = Number(formPrice.value)

  if (!Number.isInteger(year) || year < 2016 || year > 2026) {
    window.alert('年份請輸入 2016 到 2026 之間的整數')
    return
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    window.alert('月份請輸入 1 到 12 之間的整數')
    return
  }

  if (!Number.isFinite(price) || price <= 0) {
    window.alert('價格請輸入大於 0 的數字')
    return
  }

  if (!window.location.hostname || window.location.hostname.includes('github.io')) {
    const existingIndex = allPrices.value.findIndex((item) => item.year === year && item.month === month)
    const nextItem = {
      id: existingIndex >= 0 ? allPrices.value[existingIndex].id : Date.now(),
      year,
      month,
      price
    }

    if (existingIndex >= 0) {
      allPrices.value.splice(existingIndex, 1, nextItem)
    } else {
      allPrices.value.push(nextItem)
      allPrices.value.sort((left, right) => (left.year - right.year) || (left.month - right.month))
    }

    formPrice.value = ''
    observerResults.value = null
    statusMessage.value = '已在靜態預覽模式更新資料；GitHub Pages 不提供 SQLite 持久化。'
    return
  }

  await fetch('/api/prices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ year, month, price })
  })

  formPrice.value = ''
  observerResults.value = null
  statusMessage.value = ''
  await loadPrices()
}

async function deletePrice(id) {
  const confirmed = window.confirm('確定刪除這筆資料？')

  if (!confirmed) {
    return
  }

  if (!window.location.hostname || window.location.hostname.includes('github.io')) {
    allPrices.value = allPrices.value.filter((item) => item.id !== id)
    statusMessage.value = '已在靜態預覽模式刪除資料；GitHub Pages 不提供 SQLite 持久化。'
    return
  }

  await fetch(`/api/prices/${id}`, {
    method: 'DELETE'
  })

  await loadPrices()
}

onMounted(async () => {
  await Promise.all([loadPrices(), loadInflationRates()])
})
</script>

<template>
  <div class="page-shell">
    <header class="hero">
      <div>
        <p class="eyebrow">Vue SFC / Express / SQLite</p>
        <h1>甘藷歷年價格追蹤</h1>
        <p class="hero__lead">
          以單一檔案元件重寫的價格追蹤介面，保留趨勢觀察、搜尋高亮與資料管理流程。
        </p>
      </div>

      <ModeTabs v-model:activeTab="activeTab" />
    </header>

    <main class="layout">
      <section class="panel panel--chart">
        <div class="panel__header">
          <div>
            <p class="section-label">趨勢視覺化</p>
            <h2>價格走勢圖</h2>
          </div>

          <div class="panel__meta">共 {{ allPrices.length }} 筆資料</div>
        </div>

        <TrendChart :prices="allPrices" :highlights="chartHighlights" />
      </section>

      <section v-if="activeTab === 'observer'" class="panel panel--observer">
        <div class="panel__header panel__header--stacked">
          <div>
            <p class="section-label">趨勢觀察</p>
            <h2>搜尋資料與通膨提示</h2>
          </div>

          <div class="toolbar">
            <select v-model="searchYear" aria-label="搜尋年份">
              <option value="all">全部年份</option>
              <option v-for="year in years" :key="year" :value="String(year)">{{ year }} 年</option>
            </select>

            <select v-model="searchMonth" aria-label="搜尋月份">
              <option value="all">全部月份</option>
              <option v-for="month in months" :key="month" :value="String(month)">{{ month }} 月</option>
            </select>

            <button class="button button--primary" type="button" @click="searchPrices">搜尋</button>
            <button class="button button--ghost" type="button" @click="clearSearch">清空條件</button>
          </div>
        </div>

        <div v-if="inflationInfo" class="info-card">
          <span>通膨率</span>
          <strong>{{ inflationInfo.year }} 年相對 2016 年為 {{ inflationInfo.rate }}%</strong>
        </div>

        <p v-if="statusMessage" class="status-line">{{ statusMessage }}</p>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>年份</th>
                <th>月份</th>
                <th>價格 (台幣/公斤)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in visibleObserverData" :key="`${item.year}-${item.month}-${item.id}`">
                <td>{{ item.year }}</td>
                <td>{{ formatMonth(item.month) }}</td>
                <td>${{ formatCurrency(item.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else class="panel panel--management">
        <div class="panel__header panel__header--stacked">
          <div>
            <p class="section-label">資料管理</p>
            <h2>新增、修改與刪除資料</h2>
          </div>
        </div>

        <div class="management-grid">
          <form class="card form-card" @submit.prevent="savePrice">
            <h3>新增 / 修改數據</h3>

            <label>
              年份
              <input v-model="formYear" type="number" min="2016" max="2026" step="1" />
            </label>

            <label>
              月份
              <input v-model="formMonth" type="number" min="1" max="12" step="1" />
            </label>

            <label>
              價格
              <input v-model="formPrice" type="number" min="0" step="0.01" placeholder="請輸入價格" />
            </label>

            <button class="button button--primary" type="submit">存入資料</button>
          </form>

          <div class="card list-card">
            <h3>數據明細管理</h3>

            <div class="table-card table-card--dense">
              <table>
                <thead>
                  <tr>
                    <th>年份</th>
                    <th>月份</th>
                    <th>價格</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in allPrices" :key="item.id">
                    <td>{{ item.year }}</td>
                    <td>{{ formatMonth(item.month) }}</td>
                    <td>${{ formatCurrency(item.price) }}</td>
                    <td>
                      <button class="button button--danger" type="button" @click="deletePrice(item.id)">刪除</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>