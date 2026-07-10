<template>
  <v-app class="editor-shell">
    <EditorHeader
      :zoom-disabled="!imageUrl"
      :zoom-percent="zoomPercent"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @fit="fitToView"
      @set100="setActualSize"
      @reset-view="resetView"
      @preview="handlePreview"
      @export="handleExport"
      @undo="noop"
      @redo="noop"
    />

    <div class="editor-layout">
      <aside class="editor-sidebar">
        <button
          class="tool-btn"
          :class="{ 'tool-btn--active': activeTool === 'select' }"
          type="button"
          title="Selecionar"
          @click="setActiveTool('select')"
        >
          <v-icon :size="18">mdi-cursor-default</v-icon>
        </button>
        <button
          class="tool-btn"
          :class="{ 'tool-btn--active': activeTool === 'arrow' }"
          type="button"
          title="Seta"
          @click="setActiveTool('arrow')"
        >
          <v-icon :size="18">mdi-arrow-top-left</v-icon>
        </button>
        <button
          class="tool-btn"
          :class="{ 'tool-btn--active': activeTool === 'rect' }"
          type="button"
          title="Retângulo"
          @click="setActiveTool('rect')"
        >
          <v-icon :size="18">mdi-rectangle-outline</v-icon>
        </button>
        <button
          class="tool-btn"
          :class="{ 'tool-btn--active': activeTool === 'circle' }"
          type="button"
          title="Círculo"
          @click="setActiveTool('circle')"
        >
          <v-icon :size="18">mdi-circle-outline</v-icon>
        </button>
      </aside>

      <main class="editor-main">
        <div class="editor-content">
          <div ref="canvasContainerRef" class="canvas-container">
            <canvas
              v-if="imageUrl"
              ref="canvasRef"
              class="editor-canvas"
              @wheel.prevent="handleWheel"
              @mousedown="handleMouseDown"
              @contextmenu.prevent
            ></canvas>
            <div v-else class="empty-state">
              Nenhuma imagem carregada. Faça uma captura para começar.
            </div>
          </div>
        </div>
      </main>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import EditorHeader from './components/EditorHeader.vue';
import { useEditorCanvas } from './composables/useEditorCanvas';

const {
  imageUrl,
  zoomPercent,
  canvasRef,
  canvasContainerRef,
  fitToView,
  resetView,
  zoomIn,
  zoomOut,
  setActualSize,
  activeTool,
  setActiveTool,
  handleWheel,
  handleMouseDown,
  getOutputDataUrl,
  initialize,
  cleanup,
} = useEditorCanvas();

const noop = (): void => undefined;

const handlePreview = (): void => {
  const dataUrl = getOutputDataUrl();
  if (!dataUrl) {
    return;
  }
  window.open(dataUrl, '_blank', 'noopener,noreferrer');
};

const handleExport = (): void => {
  const dataUrl = getOutputDataUrl();
  if (!dataUrl) {
    return;
  }
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `snapmark-capture-${Date.now()}.png`;
  link.click();
};

onMounted(() => {
  initialize();
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style scoped>
.editor-shell {
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.editor-layout {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  min-height: calc(100vh - 64px);
}

.editor-sidebar {
  border-right: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease;
}

.tool-btn:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.tool-btn--active {
  background: #e0e7ff;
  color: #3730a3;
  border-color: #c7d2fe;
}

.editor-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
  background: #f3f4f6;
}

.canvas-container {
  max-width: min(94vw, 1600px);
  max-height: calc(100vh - 88px);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 0;
  border: 1px solid #d7dee8;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.1), 0 3px 10px rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  overflow: hidden;
}

.editor-canvas {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 12px;
  border: none;
  background: #ffffff;
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 980px) {
  .editor-layout {
    grid-template-columns: 60px minmax(0, 1fr);
  }

  .tool-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
