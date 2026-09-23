<template>
  <div class="tags-view">
    <div class="page-header">
      <h2 class="page-title">标签概览</h2>
      <el-button :loading="loading" @click="refresh">
        <el-icon class="refresh-icon" :class="{ rotating: loading }"><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 统计信息 -->
    <el-row :gutter="16" class="stat-row" v-loading="loading">
      <el-col :xs="12" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ tagStore.totalTags }}</div>
            <div class="stat-label">标签数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ tagStore.totalArticles }}</div>
            <div class="stat-label">文章总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-number">
              {{ currentTag ? (tagStore.countOf(currentTag) || 0) : tagStore.recentTags.length }}
            </div>
            <div class="stat-label">
              {{ currentTag ? '当前标签文章数' : '最近高频标签' }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 全部标签 / 当前标签 快速切换 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="section-header">
          <span>{{ currentTag ? '当前标签' : '全部标签' }}</span>
          <el-button
            v-if="currentTag"
            size="small"
            type="primary"
            plain
            @click="switchToAll"
          >
            <el-icon><Back /></el-icon>
            查看全部标签
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="currentTag && tagStore.loaded && !tagStore.hasTag(currentTag)"
        title="当前标签不存在或已被移除"
        type="warning"
        :closable="false"
        show-icon
        class="missing-alert"
      >
        <div class="missing-body">
          <el-tag type="info" size="small">{{ currentTag }}</el-tag>
          <el-button size="small" type="primary" @click="switchToAll">返回全部标签</el-button>
        </div>
      </el-alert>

      <div v-else-if="currentTag" class="current-tag-area">
        <el-tag
          size="large"
          type="primary"
          effect="dark"
          class="current-tag"
          @click="viewTagArticles(currentTag)"
        >
          {{ currentTag }}
          <span class="count-badge">{{ tagStore.countOf(currentTag) }}</span>
        </el-tag>
        <div class="current-actions">
          <el-button type="primary" @click="viewTagArticles(currentTag)">
            查看该标签文章
          </el-button>
          <el-button @click="switchToAll">切换到全部标签</el-button>
        </div>
      </div>

      <!-- 全部标签（数量过多时在容器内滚动，不破坏页面布局） -->
      <div
        v-else
        class="all-tags-scroll"
        v-loading="loading"
        element-loading-text="加载标签中..."
      >
        <template v-if="sortedTagCounts.length > 0">
          <el-tag
            class="all-tag-item"
            type="info"
            effect="plain"
            size="large"
            @click="viewAllArticles"
          >
            全部
            <span class="count-badge">{{ tagStore.totalArticles }}</span>
          </el-tag>
          <el-tag
            v-for="tag in sortedTagCounts"
            :key="tag.name"
            class="all-tag-item"
            effect="plain"
            size="large"
            @click="viewTagArticles(tag.name)"
          >
            {{ tag.name }}
            <span class="count-badge">{{ tag.count }}</span>
          </el-tag>
        </template>
        <el-empty
          v-else-if="!loading"
          description="暂无标签，发布带有标签的文章后将在这里展示"
          :image-size="80"
        />
      </div>
    </el-card>

    <!-- 最近使用的高频标签 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <span>最近使用的高频标签</span>
      </template>
      <div class="recent-area" v-loading="loading">
        <template v-if="tagStore.recentTags.length > 0">
          <div
            v-for="tag in tagStore.recentTags"
            :key="tag.name"
            class="recent-item"
            :class="{ active: currentTag === tag.name }"
            @click="viewTagArticles(tag.name)"
          >
            <span class="recent-name">{{ tag.name }}</span>
            <span class="recent-meta">
              近期 {{ tag.count }} 篇
            </span>
            <span class="recent-time">{{ formatRelativeTime(tag.lastUsedAt) }}</span>
          </div>
        </template>
        <el-empty
          v-else-if="!loading"
          description="暂无最近使用的标签"
          :image-size="80"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Refresh, Back } from '@element-plus/icons-vue'
import { useTagStore } from '../stores/tags'

const route = useRoute()
const router = useRouter()
const tagStore = useTagStore()

const loading = computed(() => tagStore.loading)

const currentTag = computed(() => route.query.tag || null)

// Sort all tags by frequency, then by name for stable ordering
const sortedTagCounts = computed(() =>
  [...tagStore.tagCounts].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.name.localeCompare(b.name, 'zh-Hans-CN')
  })
)

onMounted(() => {
  // Always request fresh counts so updates to articles are reflected here
  tagStore.fetchTags(true).catch(() => {})
})

async function refresh() {
  try {
    await tagStore.fetchTags(true)
  } catch {
    // Empty state is rendered automatically
  }
}

function switchToAll() {
  router.push({ path: '/tags' })
}

function viewTagArticles(tag) {
  router.push({ path: '/', query: { tag } })
}

function viewAllArticles() {
  router.push({ path: '/' })
}

function formatRelativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.tags-view {
  padding-top: 20px;
  max-width: 960px;
  margin: 0 auto;
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

.refresh-icon {
  margin-right: 4px;
}

.refresh-icon.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.section-card {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.missing-alert {
  margin-bottom: 0;
}

.missing-body {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.current-tag-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.current-tag {
  font-size: 16px;
  padding: 8px 16px;
  cursor: pointer;
}

.count-badge {
  margin-left: 6px;
  opacity: 0.85;
  font-weight: bold;
}

.current-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.all-tags-scroll {
  max-height: 360px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-right: 8px;
  min-height: 120px;
  align-content: flex-start;
}

.all-tag-item {
  cursor: pointer;
  font-size: 14px;
}

.recent-area {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  min-height: 80px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafbfc;
}

.recent-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.recent-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.recent-name {
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-meta {
  font-size: 12px;
  color: #409eff;
  white-space: nowrap;
}

.recent-time {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}
</style>
