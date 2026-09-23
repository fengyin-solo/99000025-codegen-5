import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useTagStore = defineStore('tags', () => {
  const tags = ref([])
  const tagCounts = ref([])
  const recentTags = ref([])
  const totalTags = ref(0)
  const totalArticles = ref(0)
  const loading = ref(false)
  const loaded = ref(false)
  // Reused so concurrent components trigger a single request
  let pendingRequest = null

  const countMap = computed(() => {
    const map = new Map()
    tagCounts.value.forEach(item => {
      map.set(item.name, item.count)
    })
    return map
  })

  function countOf(name) {
    return countMap.value.get(name) || 0
  }

  function hasTag(name) {
    return !!name && countMap.value.has(name)
  }

  function setTagData(data) {
    tags.value = data.tags || []
    tagCounts.value = data.tagCounts || []
    recentTags.value = data.recentTags || []
    totalTags.value = data.totalTags ?? (data.tags ? data.tags.length : 0)
    totalArticles.value = data.totalArticles || 0
  }

  async function fetchTags(force = false) {
    if (!force && loaded.value) return
    if (pendingRequest) return pendingRequest

    loading.value = true
    pendingRequest = api
      .get('/tags')
      .then(response => {
        setTagData(response.data)
        loaded.value = true
        return response.data
      })
      .catch(error => {
        console.error('Failed to fetch tags:', error)
        // Keep the store usable (empty state) when the request fails
        setTagData({ tags: [], tagCounts: [], recentTags: [] })
        throw error
      })
      .finally(() => {
        loading.value = false
        pendingRequest = null
      })

    return pendingRequest
  }

  // Force a fresh fetch on the next request, e.g. after an article is created/updated/deleted
  function invalidate() {
    loaded.value = false
  }

  return {
    tags,
    tagCounts,
    recentTags,
    totalTags,
    totalArticles,
    loading,
    loaded,
    countMap,
    countOf,
    hasTag,
    fetchTags,
    invalidate
  }
})
