<template>
  <header class="editor-header">
    <div class="group group-left">
      <div class="brand">
        <div class="brand__logo" aria-hidden="true"></div>
        <span class="brand__name">SnapMark Editor</span>
      </div>
      <span class="separator" aria-hidden="true"></span>
      <input
        v-if="isEditingTitle"
        ref="projectTitleInputRef"
        v-model="projectTitleDraft"
        class="project-title-input"
        maxlength="80"
        @blur="saveTitle"
        @keydown.enter.prevent="saveTitle"
        @keydown.esc.prevent="cancelTitleEdit"
      />
      <button
        v-else
        class="project-title-button"
        type="button"
        :title="projectTitle"
        @click="startTitleEdit"
      >
        {{ projectTitle }}
      </button>
    </div>

    <div class="group group-center">
      <div class="zoom-pill">
        <button class="icon-btn icon-btn--pill" :disabled="zoomDisabled" type="button" @click="$emit('zoomOut')">
          <v-icon :size="18">mdi-magnify-minus</v-icon>
        </button>
        <span class="zoom-value">{{ zoomPercent }}%</span>
        <button class="icon-btn icon-btn--pill" :disabled="zoomDisabled" type="button" @click="$emit('zoomIn')">
          <v-icon :size="18">mdi-magnify-plus</v-icon>
        </button>
      </div>
      <button class="secondary-btn" :disabled="zoomDisabled" type="button" @click="$emit('fit')">Fit</button>
      <button class="secondary-btn" :disabled="zoomDisabled" type="button" @click="$emit('set100')">100%</button>
      <button class="secondary-btn secondary-btn--with-icon" :disabled="zoomDisabled" type="button" @click="$emit('resetView')">
        <v-icon :size="16">mdi-refresh</v-icon>
        <span class="reset-label">Reset View</span>
      </button>
    </div>

    <div class="group group-right">
      <button class="icon-btn" :disabled="true" type="button" @click="$emit('undo')">
        <v-icon :size="18">mdi-undo-variant</v-icon>
      </button>
      <button class="icon-btn" :disabled="true" type="button" @click="$emit('redo')">
        <v-icon :size="18">mdi-redo-variant</v-icon>
      </button>
      <button class="secondary-btn preview-btn" :disabled="zoomDisabled" type="button" @click="$emit('preview')">
        <v-icon :size="18">mdi-eye-outline</v-icon>
        <span class="preview-label">Preview</span>
      </button>
      <button class="primary-btn" :disabled="zoomDisabled" type="button" @click="$emit('export')">
        <v-icon :size="18">mdi-download</v-icon>
        <span>Export</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';

const props = defineProps<{
  projectTitle: string;
  zoomPercent: number;
  zoomDisabled?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:projectTitle', value: string): void;
  (event: 'zoomIn'): void;
  (event: 'zoomOut'): void;
  (event: 'fit'): void;
  (event: 'set100'): void;
  (event: 'resetView'): void;
  (event: 'undo'): void;
  (event: 'redo'): void;
  (event: 'preview'): void;
  (event: 'export'): void;
}>();

const isEditingTitle = ref(false);
const projectTitleDraft = ref(props.projectTitle);
const projectTitleInputRef = ref<HTMLInputElement | null>(null);

const startTitleEdit = async (): Promise<void> => {
  projectTitleDraft.value = props.projectTitle;
  isEditingTitle.value = true;
  await nextTick();
  projectTitleInputRef.value?.focus();
  projectTitleInputRef.value?.select();
};

const saveTitle = (): void => {
  const normalizedTitle = projectTitleDraft.value.trim() || 'Projeto sem nome';
  emit('update:projectTitle', normalizedTitle);
  isEditingTitle.value = false;
};

const cancelTitleEdit = (): void => {
  projectTitleDraft.value = props.projectTitle;
  isEditingTitle.value = false;
};
</script>

<style scoped>
.editor-header {
  height: 64px;
  padding: 0 24px;
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto minmax(260px, 1fr);
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-left {
  min-width: 0;
}

.group-center {
  justify-self: center;
}

.group-right {
  justify-self: end;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.brand__logo {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.brand__name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
}

.separator {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
}

.project-title-button {
  max-width: 240px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background-color 180ms ease;
}

.project-title-button:hover {
  background: #f3f4f6;
}

.project-title-input {
  width: 220px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  padding: 0 10px;
}

.zoom-pill {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  padding: 0 6px;
}

.zoom-value {
  min-width: 52px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease;
}

.icon-btn--pill {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
}

.icon-btn:hover:not(:disabled),
.secondary-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.secondary-btn {
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease;
}

.primary-btn {
  height: 36px;
  border: 1px solid #1d4ed8;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease;
}

.primary-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 1320px) {
  .editor-header {
    grid-template-columns: minmax(220px, 1fr) auto;
    grid-template-areas:
      'left right'
      'center center';
    height: auto;
    padding: 10px 16px;
    gap: 10px 16px;
  }

  .group-left {
    grid-area: left;
  }

  .group-center {
    grid-area: center;
    justify-self: start;
  }

  .group-right {
    grid-area: right;
  }
}

@media (max-width: 980px) {
  .separator,
  .preview-label,
  .reset-label {
    display: none;
  }

  .project-title-button,
  .project-title-input {
    max-width: 140px;
    width: 140px;
  }
}
</style>
