import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

// Bumped whenever articles are created/updated/deleted so cached tag counts
// can be refreshed when views are reactivated.
export const useTagsStore = defineStore('tags', () => {
  const tagStats = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const articlesVersion = ref(0)

  const tags = computed(() => tagStats.value.map(tag => tag.name))
  const totalTags = computed(() => tagStats.value.length)

  const countMap = computed(() => {
    const map = {}
    tagStats.value.forEach(tag => {
      map[tag.name] = tag.count
    })
    return map
  })

  // High-frequency tags: most articles first, recently used breaks ties.
  const popularTags = computed(() =>
    [...tagStats.value]
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return (b.lastUsedAt || '').localeCompare(a.lastUsedAt || '')
      })
      .slice(0, 10)
  )

  // Recently used tags: latest article update first, count breaks ties.
  const recentTags = computed(() =>
    [...tagStats.value]
      .sort((a, b) => {
        const diff = (b.lastUsedAt || '').localeCompare(a.lastUsedAt || '')
        if (diff !== 0) return diff
        return b.count - a.count
      })
      .slice(0, 10)
  )

  function getCount(name) {
    return countMap.value[name] || 0
  }

  function getTag(name) {
    return tagStats.value.find(tag => tag.name === name) || null
  }

  async function fetchTags(force = false) {
    if (loading.value) return
    loading.value = true
    try {
      const response = await api.get('/tags', { params: { detail: 1 } })
      tagStats.value = response.data.tagStats || []
      loaded.value = true
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      // Keep previously loaded tags usable even if the refresh fails.
      if (!loaded.value) tagStats.value = []
    } finally {
      loading.value = false
    }
  }

  function notifyArticlesChanged() {
    articlesVersion.value += 1
  }

  return {
    tagStats,
    tags,
    totalTags,
    countMap,
    popularTags,
    recentTags,
    loading,
    loaded,
    articlesVersion,
    getCount,
    getTag,
    fetchTags,
    notifyArticlesChanged
  }
})
