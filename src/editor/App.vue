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

    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="fill-height d-flex align-center justify-center">
        <div class="canvas-container elevation-3 bg-white">
          <div class="text-subtitle-1 text-grey-darken-1 pa-8">
            Nenhuma imagem carregada. Capture uma aba para começar.
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>

<style scoped>
.canvas-container {
  min-width: 600px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.gap-2 {
  gap: 8px;
}
</style>
