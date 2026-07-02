<template>
  <v-app>
    <v-app-bar color="primary" density="compact" flat>
      <v-app-bar-title class="font-weight-bold">SnapMark Editor</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-undo" disabled></v-btn>
      <v-btn icon="mdi-redo" disabled></v-btn>
      <v-divider vertical class="mx-2"></v-divider>
      <v-btn color="success" variant="elevated" prepend-icon="mdi-download" class="mr-2">
        Exportar
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer permanent width="80" rail>
      <v-list density="compact" nav class="d-flex flex-column align-center py-4 gap-2">
        <v-list-item value="select" active color="primary" class="mb-2">
          <v-icon size="large">mdi-cursor-default</v-icon>
        </v-list-item>
        <v-list-item value="arrow" color="primary" class="mb-2">
          <v-icon size="large">mdi-arrow-top-left</v-icon>
        </v-list-item>
        <v-list-item value="rect" color="primary" class="mb-2">
          <v-icon size="large">mdi-rectangle-outline</v-icon>
        </v-list-item>
        <v-list-item value="circle" color="primary" class="mb-2">
          <v-icon size="large">mdi-circle-outline</v-icon>
        </v-list-item>
        <v-list-item value="text" color="primary" class="mb-2">
          <v-icon size="large">mdi-format-text</v-icon>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="editor-main">
      <v-container fluid class="editor-content fill-height d-flex align-center justify-center">
        <div class="canvas-container elevation-3 bg-white">
          <img v-if="imageUrl" :src="imageUrl" alt="Captura da aba" class="captured-image" />
          <div v-else class="empty-state text-subtitle-1 text-grey-darken-1">
            Nenhuma imagem carregada. Faça uma captura para começar.
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const imageUrl = ref<string | null>(null);

onMounted(() => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('capturedImage', (result) => {
      if (!result.capturedImage) {
        return;
      }
      imageUrl.value = result.capturedImage;
    });
  }
});
</script>

<style scoped>
.editor-main {
  background: #f3f4f6;
}

.editor-content {
  padding: 16px;
}

.canvas-container {
  max-width: min(94vw, 1600px);
  max-height: calc(100vh - 88px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 6px;
  overflow: hidden;
}

.captured-image {
  max-width: min(94vw, 1600px);
  max-height: calc(100vh - 108px);
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.empty-state {
  padding: 32px;
  text-align: center;
}

.gap-2 {
  gap: 8px;
}
</style>
