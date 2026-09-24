<template>
  <div class="tags-view">
    <div class="page-header">
      <h2 class="page-title">标签导航</h2>
      <el-button :icon="ArrowLeft" @click="goBack">返回文章列表</el-button>
    </div>

    <!-- Overview stats + quick switch between all tags and the current tag -->
    <el-row :gutter="20" v-loading="store.loading">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-number">{{ store.totalTags }}</div>
          <div class="stat-label">标签总数</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card" @click="goToTag(null)">
          <div class="stat-number">{{ totalArticles }}</div>
          <div class="stat-label">全部文章（点击查看）</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card current-card">
          <template v-if="currentTag">
            <div class="stat-current-name"># {{ currentTag }}</div>
            <div class="stat-label">
              {{ currentTagExists ? `${currentCount} 篇文章` : '该标签下暂无文章' }}
            </div>
            <el-button
              v-if="currentTagExists"
              size="small"
              type="primary"
              class="switch-button"
              @click="viewCurrentTagArticles"
            >
              查看该标签文章
            </el-button>
            <el-button
              size="small"
              class="switch-button"
              @click="goToTag(null)"
            >
              切换到全部标签
            </el-button>
          </template>
          <template v-else>
            <div class="stat-current-name">全部标签</div>
            <div class="stat-label">点击任意标签查看对应文章</div>
            <el-button
              size="small"
              type="primary"
              class="switch-button"
              @click="goToTag(null)"
            >
              浏览全部文章
            </el-button>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-empty
      v-if="!store.loading && store.totalTags === 0"
      description="还没有任何标签"
      class="tags-empty"
    >
      <el-button type="primary" @click="goToTag(null)">浏览全部文章</el-button>
    </el-empty>

    <template v-else>
      <!-- Current tag banner: jump straight to the filtered article list -->
      <el-alert
        v-if="currentTag && currentTagExists"
        :closable="false"
        type="success"
        class="current-banner"
      >
        <div class="banner-content">
          <span>
            当前标签：<strong># {{ currentTag }}</strong>，共 {{ currentCount }} 篇文章
          </span>
          <span class="banner-actions">
            <el-button type="primary" size="small" @click="viewCurrentTagArticles">
              查看该标签文章
            </el-button>
            <el-button size="small" @click="goToTag(null)">
              切换到全部标签
            </el-button>
          </span>
        </div>
      </el-alert>
      <el-alert
        v-else-if="currentTag && !currentTagExists"
        :closable="false"
        type="warning"
        class="current-banner"
      >
        <div class="banner-content">
          <span>标签「{{ currentTag }}」暂无文章（可能已被移除）</span>
          <el-button size="small" @click="goToTag(null)">查看全部标签</el-button>
        </div>
      </el-alert>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>高频标签</span>
                <span class="section-hint">按文章数量</span>
              </div>
            </template>
            <div v-if="store.popularTags.length" class="chip-list">
              <button
                v-for="(tag, index) in store.popularTags"
                :key="`popular-${tag.name}`"
                type="button"
                class="tag-chip"
                :class="{ active: tag.name === currentTag }"
                @click="selectTag(tag.name)"
              >
                <span v-if="index < 3" class="rank">{{ index + 1 }}</span>
                <span class="chip-name">{{ tag.name }}</span>
                <span class="chip-count">{{ tag.count }}</span>
              </button>
            </div>            <el-empty v-else :image-size="60" description="暂无数据" />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>最近使用</span>
                <span class="section-hint">按最近更新时间</span>
              </div>
            </template>
            <div v-if="store.recentTags.length" class="recent-list">
              <button
                v-for="tag in store.recentTags"
                :key="`recent-${tag.name}`"
                type="button"
                class="recent-item"
                :class="{ active: tag.name === currentTag }"
                @click="selectTag(tag.name)"
              >
                <span class="chip-name"># {{ tag.name }}</span>
                <span class="recent-meta">
                  {{ tag.count }} 篇 · {{ formatRelativeTime(tag.lastUsedAt) }}
                </span>
              </button>
            </div>
            <el-empty v-else :image-size="60" description="暂无数据" />
          </el-card>
        </el-col>
      </el-row>

      <!-- All tags: scrollable when the list overflows the viewport -->
      <el-card shadow="never" class="section-card all-tags-card">
        <template #header>
          <div class="section-header">
            <span>全部标签（{{ store.totalTags }}）</span>
            <el-button
              v-if="currentTag"
              text
              type="primary"
              size="small"
              @click="goToTag(null)"
            >
              切换到全部标签
            </el-button>
          </div>
        </template>
        <div class="all-tags-scroll">
          <button
            type="button"
            class="tag-chip"
            :class="{ active: currentTag === null }"
            @click="selectTag(null)"
          >
            <span class="chip-name">全部文章</span>
            <span class="chip-count">{{ totalArticles }}</span>
          </button>
          <button
            v-for="tag in store.tagStats"
            :key="tag.name"
            type="button"
            class="tag-chip"
            :class="{ active: tag.name === currentTag }"
            @click="selectTag(tag.name)"
          >
            <span class="chip-name">{{ tag.name }}</span>
            <span class="chip-count">{{ tag.count }}</span>
          </button>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useTagsStore } from '../stores/tags'

const route = useRoute()
const router = useRouter()
const store = useTagsStore()

const currentTag = ref(route.query.tag ? String(route.query.tag) : null)

const currentTagInfo = computed(() =>
  currentTag.value ? store.getTag(currentTag.value) : null
)
const currentTagExists = computed(() => currentTagInfo.value !== null)
const currentCount = computed(() => currentTagInfo.value?.count || 0)
const totalArticles = computed(() =>
  store.tagStats.reduce((sum, tag) => sum + tag.count, 0)
)

watch(
  () => route.query.tag,
  (tag) => {
    currentTag.value = tag ? String(tag) : null
  }
)

onMounted(() => {
  store.fetchTags()
})

// Tag entries navigate straight to the (tag-filtered) article list.
function selectTag(tag) {
  goToTag(tag)
}

function viewCurrentTagArticles() {
  goToTag(currentTag.value)
}

function goToTag(tag) {
  if (tag) {
    if (route.path === '/' && route.query.tag === tag) return
    router.push({ path: '/', query: { tag } })
  } else {
    if (route.path === '/' && !route.query.tag && !route.query.search) return
    router.push({ path: '/' })
  }
}

function goBack() {
  // Prefer returning to the article list the user came from.
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    goToTag(currentTag.value)
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return '未知时间'
  const date = new Date(isoString)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.tags-view {
  padding-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.stat-card {
  text-align: center;
  margin-bottom: 20px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.stat-current-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
  word-break: break-all;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-top: 4px;
}

.switch-button {
  margin-top: 10px;
}

.current-card {
  background-color: #f0f9ff;
}

.current-banner {
  margin-bottom: 20px;
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.banner-actions {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.section-card {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #303133;
}

.section-hint {
  font-weight: normal;
  font-size: 12px;
  color: #909399;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 16px;
  background-color: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
}

.tag-chip:hover {
  border-color: #409eff;
  color: #409eff;
}

.tag-chip.active {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.tag-chip.active .chip-count {
  background-color: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.chip-name {
  word-break: break-all;
}

.chip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background-color: #f0f2f5;
  color: #909399;
  font-size: 12px;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #f56c6c;
  color: #fff;
  font-size: 12px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #303133;
  text-align: left;
  transition: background-color 0.2s;
}

.recent-item:hover {
  background-color: #f5f7fa;
}

.recent-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.recent-meta {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.all-tags-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 8px;
}

.tags-empty {
  background-color: #fff;
  border-radius: 4px;
  padding: 40px 0;
}
</style>
