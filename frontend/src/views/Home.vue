<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="18">
        <h2 class="page-title">
          {{ pageTitle }}
          <el-tag v-if="searchQuery" type="info" class="search-tag" closable @close="clearSearch">
            搜索: {{ searchQuery }}
          </el-tag>
          <el-tag
            v-if="selectedTag"
            type="primary"
            class="search-tag"
            closable
            @close="handleTagSelect(null)"
          >
            标签: {{ selectedTag }}
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
          :tags="tagStore.tags"
          :selected-tag="selectedTag"
          :tag-counts="tagStore.countMap"
          :total-articles="tagStore.totalArticles"
          :loading="tagStore.loading && !tagStore.loaded"
          @select="handleTagSelect"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import { useTagStore } from '../stores/tags'
import ArticleCard from '../components/ArticleCard.vue'
import TagFilter from '../components/TagFilter.vue'
import Pagination from '../components/Pagination.vue'

const route = useRoute()
const router = useRouter()
const tagStore = useTagStore()

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
  syncFromRoute()
  fetchArticles()
  // Cache-first load; forced refresh happens after article changes
  tagStore.fetchTags().catch(() => {})
})

watch(() => route.query, () => {
  syncFromRoute()
  fetchArticles()
})

function syncFromRoute() {
  selectedTag.value = route.query.tag || null
  searchQuery.value = route.query.search || ''
  const page = parseInt(route.query.page, 10)
  currentPage.value = page > 0 ? page : 1
}

function buildListQuery() {
  const query = {}
  if (selectedTag.value) query.tag = selectedTag.value
  if (searchQuery.value) query.search = searchQuery.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  return query
}

async function fetchArticles() {
  loading.value = true
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
    // If the URL points beyond the last page (e.g. after an article was removed),
    // fall back to the last available page without breaking the view
    const lastPage = Math.max(1, response.data.pagination.totalPages)
    if (currentPage.value > lastPage) {
      currentPage.value = lastPage
      await router.replace({ query: buildListQuery() })
      return
    }
  } catch (error) {
    console.error('Failed to fetch articles:', error)
  } finally {
    loading.value = false
  }
}

// Pagination is reflected in the URL so returning from an article restores the result
function handlePageChange(page) {
  currentPage.value = page
  router.push({ query: buildListQuery() })
}

function handleTagSelect(tag) {
  selectedTag.value = tag
  currentPage.value = 1

  const query = {}
  if (tag) query.tag = tag
  if (searchQuery.value) query.search = searchQuery.value

  router.push({ query })
}

function clearSearch() {
  const query = {}
  if (selectedTag.value) query.tag = selectedTag.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  router.push({ query })
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
  flex-wrap: wrap;
}

.search-tag {
  font-size: 14px;
  font-weight: normal;
}
</style>
