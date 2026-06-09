<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:activeTab'])

function selectTab(tab) {
  emit('update:activeTab', tab)
}
</script>

<template>
  <nav class="mode-tabs" aria-label="主要功能切換">
    <button
      type="button"
      class="mode-tabs__button"
      :class="{ 'is-active': activeTab === 'observer' }"
      @click="selectTab('observer')"
    >
      趨勢觀察
    </button>

    <button
      type="button"
      class="mode-tabs__button"
      :class="{ 'is-active': activeTab === 'management' }"
      @click="selectTab('management')"
    >
      資料管理
    </button>
  </nav>
</template>