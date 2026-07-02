<template>
  <v-app>
    <v-main>
      <v-container class="d-flex flex-column align-center justify-center" style="width: 300px; height: 180px;">
        <div class="text-h5 font-weight-bold mb-2 text-primary">SnapMark</div>
        <div class="text-body-2 text-grey-darken-1 mb-4 text-center">
          Capture a aba atual e faça anotações no editor.
        </div>
        <v-btn
          color="primary"
          size="large"
          rounded="lg"
          block
          @click="captureTab"
        >
          Capturar Tela
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const captureTab = () => {
  console.log('Capturando aba...');
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
