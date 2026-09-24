<template>
  <div class="tag-filter">
    <div class="filter-header">
      <h4 class="filter-title">标签筛选</h4>
      <el-button text type="primary" size="small" @click="goToOverview">
        标签导航
      </el-button>
    </div>

    <div v-loading="loading && normalizedTags.length === 0" class="tag-list-scroll">
      <div class="tag-list">
        <el-tag
          :type="selectedTag === null ? '' : 'info'"
          class="tag-item"
          @click="selectTag(null)"
          effect="dark"
        >
          全部
        </el-tag>
        <el-tag
          v-for="tag in normalizedTags"
          :key="tag.name"
          :type="selectedTag === tag.name ? '' : 'info'"
          :effect="selectedTag === tag.name ? 'dark' : 'plain'"
          class="tag-item"
          @click="selectTag(tag.name)"
        >
          {{ tag.name }}
          <span class="tag-count">{{ tag.count }}</span>
        </el-tag>
      </div>
      <el-empty
        v-if="!loading && normalizedTags.length === 0"
        :image-size="50"
        description="暂无标签"
        class="tag-empty"
      >
        <el-button text type="primary" size="small" @click="goToOverview">
          打开标签导航
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  // Accepts both plain tag names (['Vue']) and detailed stats
  // ([{ name: 'Vue', count: 3 }]).
  tags: {
    type: Array,
    default: () => []
  },
  selectedTag: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])
const router = useRouter()

const normalizedTags = computed(() =>
  props.tags
    .map(tag =>
      typeof tag === 'string'
        ? { name: tag, count: null }
        : { name: tag.name, count: tag.count ?? null }
    )
    .filter(tag => !!tag.name)
)

function selectTag(tag) {
  emit('select', tag)
}

function goToOverview() {
  const query = props.selectedTag ? { tag: props.selectedTag } : {}
  router.push({ path: '/tags', query })
}
</script>

<style scoped>
.tag-filter {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  padding: 16px;
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

/* Scroll instead of overflowing when there are many tags */
.tag-list-scroll {
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tag-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background-color: rgba(0, 0, 0, 0.08);
  font-size: 12px;
  line-height: 1;
}

.tag-empty {
  padding: 10px 0;
}

.tag-empty :deep(.el-empty__description) {
  font-size: 12px;
}
</style>
