<template>
  <div class="tag-filter">
    <div class="filter-header">
      <h4 class="filter-title">标签筛选</h4>
      <router-link :to="overviewLink" class="overview-link">标签概览</router-link>
    </div>

    <div v-loading="loading" class="tag-list">
      <el-tag
        :type="selectedTag === null ? '' : 'info'"
        :effect="selectedTag === null ? 'dark' : 'plain'"
        class="tag-item"
        @click="selectTag(null)"
      >
        全部<template v-if="showCounts && totalArticles > 0"> {{ totalArticles }}</template>
      </el-tag>

      <template v-if="tags.length > 0">
        <el-tag
          v-for="tag in tags"
          :key="tag"
          :type="selectedTag === tag ? '' : 'info'"
          :effect="selectedTag === tag ? 'dark' : 'plain'"
          class="tag-item"
          @click="selectTag(tag)"
        >
          {{ tag }}<template v-if="showCounts"> {{ countOf(tag) }}</template>
        </el-tag>
      </template>
    </div>

    <div v-if="!loading && tags.length === 0" class="tag-empty">
      <el-text type="info" size="small">暂无标签</el-text>
      <router-link :to="overviewLink" class="empty-link">查看标签概览</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  selectedTag: {
    type: String,
    default: null
  },
  // Optional: Map of tag name -> article count
  tagCounts: {
    type: [Object, Map],
    default: null
  },
  totalArticles: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const showCounts = computed(() => props.tagCounts instanceof Map && props.tagCounts.size > 0)

const overviewLink = computed(() =>
  props.selectedTag ? { path: '/tags', query: { tag: props.selectedTag } } : { path: '/tags' }
)

function countOf(tag) {
  return props.tagCounts instanceof Map ? props.tagCounts.get(tag) || 0 : ''
}

function selectTag(tag) {
  emit('select', tag)
}
</script>

<style scoped>
.tag-filter {
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.filter-title {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.overview-link {
  font-size: 13px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 24px;
  /* Keep the sidebar usable when the number of tags exceeds the viewport */
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
  align-content: flex-start;
}

.tag-item {
  cursor: pointer;
}

.tag-empty {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.empty-link {
  font-size: 13px;
}
</style>
