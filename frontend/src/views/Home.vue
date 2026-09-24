<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="18">
        <h2 class="page-title">
          {{ pageTitle }}
          <el-tag v-if="searchQuery" type="info" class="search-tag" closable @close="clearSearch">
            搜索: {{ searchQuery }}
          </el-tag>
        </h2>

        <div v-loading="loading">
          <ArticleCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
            :highlight-query="searchQuery"
            @tag-click="handleTagSelect"
          />

          <el-empty v-if="!loading && articles.length === 0" :description="emptyDescription" />
        </div>

        <Pagination
          v-model="currentPage"
          :total="pagination.total"
          :page-size="pagination.limit"
          @change="handlePageChange"
        />
      </el-col>

      <el-col :span="6">
        <TagFilter
          :tags="tagsStore.tagStats"
          :selected-tag="selectedTag"
          :loading="tagsStore.loading"
          @select="handleTagSelect"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, onDeactivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import { useTagsStore } from '../stores/tags'
import ArticleCard from '../components/ArticleCard.vue'
import TagFilter from '../components/TagFilter.vue'
import Pagination from '../components/Pagination.vue'

defineOptions({ name: 'Home' })

const route = useRoute()
const router = useRouter()
const tagsStore = useTagsStore()

const articles = ref([])
const loading = ref(false)
const selectedTag = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0
})

let mounted = false
let isActive = true
let firstActivation = true
let savedScrollY = 0
let lastArticlesVersion = tagsStore.articlesVersion

const pageTitle = computed(() => {
  if (searchQuery.value) {
    return '搜索结果'
  }
  return selectedTag.value ? `标签: ${selectedTag.value}` : '最新文章'
})

const emptyDescription = computed(() => {
  if (searchQuery.value) {
    return '未找到匹配的文章'
  }
  if (selectedTag.value) {
    return `标签「${selectedTag.value}」下暂无文章`
  }
  return '暂无文章'
})

onMounted(() => {
  syncFromRoute(true)
  fetchArticles()
  tagsStore.fetchTags()
  lastArticlesVersion = tagsStore.articlesVersion
  mounted = true
})

onActivated(() => {
  // onActivated also fires right after the first onMounted; that initial
  // activation was already handled there.
  if (firstActivation) {
    firstActivation = false
    return
  }

  // Restores scroll position when coming back from an article detail page.
  if (savedScrollY) {
    window.scrollTo(0, savedScrollY)
  }

  // A direct navigation with a different query (e.g. navbar search) needs a
  // full reset; otherwise we only refresh data silently in the background.
  if (syncFromRoute(false)) {
    currentPage.value = 1
    fetchArticles()
  } else {
    refreshSilentlyIfStale()
  }

  // Keep tag counts fresh after article create/update/delete, or if the
  // overview page refreshed the tags while Home was deactivated.
  tagsStore.fetchTags()
  isActive = true
})

onDeactivated(() => {
  isActive = false
  savedScrollY = window.scrollY
})

watch(() => route.query, () => {
  // Ignore query changes that happen on other pages while Home is cached,
  // so returning to the list always restores the original result.
  if (!mounted || !isActive) return
  const changed = syncFromRoute(false)
  if (changed) {
    currentPage.value = 1
    fetchArticles()
  }
})

// Copies the tag/search state out of the route query. Returns true when the
// effective filter actually changed.
function syncFromRoute(initial) {
  const routeTag = route.query.tag ? String(route.query.tag) : null
  const routeSearch = route.query.search ? String(route.query.search) : ''

  const changed = initial
    ? true
    : routeTag !== selectedTag.value || routeSearch !== searchQuery.value

  selectedTag.value = routeTag
  searchQuery.value = routeSearch
  return changed
}

async function refreshSilentlyIfStale() {
  if (tagsStore.articlesVersion === lastArticlesVersion) return
  await fetchArticles(true)
  lastArticlesVersion = tagsStore.articlesVersion
}

async function fetchArticles(silent = false) {
  loading.value = !silent
  try {
    const params = {
      page: currentPage.value,
      limit: pagination.value.limit
    }
    if (selectedTag.value) {
      params.tag = selectedTag.value
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await api.get('/articles', { params })
    articles.value = response.data.articles
    pagination.value = response.data.pagination

    // The article could have been deleted while we were away; fall back to
    // the first page instead of showing an empty stale page.
    if (silent && articles.value.length === 0 && currentPage.value > 1) {
      currentPage.value = 1
      const retry = await api.get('/articles', {
        params: { page: 1, limit: pagination.value.limit, ...(selectedTag.value ? { tag: selectedTag.value } : {}) }
      })
      articles.value = retry.data.articles
      pagination.value = retry.data.pagination
    }
  } catch (error) {
    console.error('Failed to fetch articles:', error)
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  fetchArticles()
}

function handleTagSelect(tag) {
  if (tag === selectedTag.value) return
  selectedTag.value = tag
  currentPage.value = 1

  const query = {}
  if (tag) query.tag = tag
  if (searchQuery.value) query.search = searchQuery.value

  router.replace({ query })
  fetchArticles()
}

function clearSearch() {
  searchQuery.value = ''
  const query = {}
  if (selectedTag.value) query.tag = selectedTag.value
  router.replace({ query })
  currentPage.value = 1
  fetchArticles()
}
</script>

<style scoped>
.home {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-tag {
  font-size: 14px;
  font-weight: normal;
}
</style>
