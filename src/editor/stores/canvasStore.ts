import { defineStore } from 'pinia';
import type { CanvasElement, ToolType } from '../types/canvas';

type CanvasState = {
  activeTool: ToolType;
  elements: CanvasElement[];
  draftElement: CanvasElement | null;
  strokeColor: string;
  strokeWidth: number;
};

const createElementId = (): string => `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useCanvasStore = defineStore('canvas', {
  state: (): CanvasState => ({
    activeTool: 'select',
    elements: [],
    draftElement: null,
    strokeColor: '#2563eb',
    strokeWidth: 3,
  }),
  actions: {
    setActiveTool(tool: ToolType) {
      this.activeTool = tool;
      this.draftElement = null;
    },
    createElementId() {
      return createElementId();
    },
    setDraftElement(element: CanvasElement | null) {
      this.draftElement = element;
    },
    commitDraftElement() {
      if (!this.draftElement) {
        return;
      }
      this.elements.push(this.draftElement);
      this.draftElement = null;
    },
    addElement(element: CanvasElement) {
      this.elements.push(element);
    },
    updateElement(elementId: string, updater: (current: CanvasElement) => CanvasElement) {
      const index = this.elements.findIndex((element) => element.id === elementId);
      if (index < 0) {
        return;
      }
      const current = this.elements[index];
      this.elements[index] = updater(current);
    },
    removeElement(elementId: string) {
      this.elements = this.elements.filter((element) => element.id !== elementId);
    },
    clearDraftElement() {
      this.draftElement = null;
    },
    clearElements() {
      this.elements = [];
      this.draftElement = null;
    },
  },
});
