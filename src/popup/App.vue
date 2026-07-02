<template>
  <div class="popup-root">
    <header class="header">
      <div class="brand-badge" aria-hidden="true"></div>
      <div>
        <h1>SnapMark</h1>
        <p>Captura rápida da aba atual.</p>
      </div>
    </header>

    <button class="capture-btn" :disabled="isCapturing" @click="captureTab">
      {{ isCapturing ? 'Capturando...' : 'Capturar tela' }}
    </button>

    <p class="hint">A imagem será aberta no editor em uma nova aba.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime?.id;
const isCapturing = ref(false);

const captureTab = () => {
  if (isCapturing.value) {
    return;
  }

  isCapturing.value = true;

  if (isExtension) {
    chrome.runtime.sendMessage({ action: 'capture-tab' }, (response) => {
      isCapturing.value = false;
      if (!response?.success) {
        console.error('Falha ao capturar aba:', response?.error);
        return;
      }
      window.close();
    });
  } else {
    console.log('Capturando aba (Mock - Dev Server)...');
    window.open('/src/editor/index.html', '_blank');
    isCapturing.value = false;
  }
};
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  width: 320px;
  min-height: 180px;
  margin: 0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f7f8fa;
}
</style>

<style scoped>
.popup-root {
  width: 100%;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-badge {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
}

.header h1 {
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
}

.header p {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.capture-btn {
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 8px;
  background: #111827;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.capture-btn:hover:not(:disabled) {
  background: #1f2937;
}

.capture-btn:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.hint {
  margin: 0;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.4;
}
</style>
