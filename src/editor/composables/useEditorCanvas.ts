import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { renderCanvasScene, renderOutputCanvas, type CanvasCamera } from '../render/renderCanvas';
import { getCapturedImage } from '../services/capturedImageService';
import { useCanvasStore } from '../stores/canvasStore';
import type { Point, ToolType } from '../types/canvas';
import { createCanvasElementDraft, isDrawableElement } from '../utils/canvasElements';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 6;
const ZOOM_FACTOR = 1.1;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const useEditorCanvas = () => {
  const canvasStore = useCanvasStore();
  const { activeTool, elements, draftElement } = storeToRefs(canvasStore);

  const imageUrl = ref<string | null>(null);
  const zoomPercent = ref(100);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const canvasContainerRef = ref<HTMLElement | null>(null);

  const camera: CanvasCamera = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  };

  let imageElement: HTMLImageElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let isSpacePressed = false;
  let isPanning = false;
  let isDrawing = false;
  let fitScale = 1;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let drawingStartPoint: Point | null = null;

  const updateZoomPercent = (): void => {
    zoomPercent.value = Math.round(camera.scale * 100);
  };

  const getOutputDataUrl = (): string | null => {
    if (!imageElement) {
      return null;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = imageElement.width;
    outputCanvas.height = imageElement.height;

    const context = outputCanvas.getContext('2d');
    if (!context) {
      return null;
    }

    renderOutputCanvas(context, imageElement, elements.value);

    return outputCanvas.toDataURL('image/png');
  };

  const requestRender = (): void => {
    const canvas = canvasRef.value;
    const container = canvasContainerRef.value;
    if (!canvas || !container) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    renderCanvasScene({
      context,
      width,
      height,
      dpr,
      imageElement,
      camera,
      elements: elements.value,
      draftElement: draftElement.value,
    });
  };

  const centerImageAtScale = (scale: number): void => {
    const container = canvasContainerRef.value;
    if (!container || !imageElement) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.scale = clamp(scale, MIN_ZOOM, MAX_ZOOM);
    camera.offsetX = (width - imageElement.width * camera.scale) / 2;
    camera.offsetY = (height - imageElement.height * camera.scale) / 2;
    updateZoomPercent();
    requestRender();
  };

  /**
   * Fits the full captured image inside the current viewport.
   */
  const fitToView = (): void => {
    const container = canvasContainerRef.value;
    if (!container || !imageElement) {
      return;
    }

    const scaleX = container.clientWidth / imageElement.width;
    const scaleY = container.clientHeight / imageElement.height;
    fitScale = clamp(Math.min(scaleX, scaleY), MIN_ZOOM, MAX_ZOOM);
    centerImageAtScale(fitScale);
  };

  const clearTransientInteractionState = (): void => {
    isDrawing = false;
    drawingStartPoint = null;
    isPanning = false;
    canvasStore.clearDraftElement();
    setPanCursor();
  };

  /**
   * Returns the editor to its default safe view and cancels in-progress input.
   */
  const resetView = (): void => {
    clearTransientInteractionState();
    fitToView();
  };

  /**
   * Shows the image at its natural size: one image pixel per canvas CSS pixel.
   */
  const setActualSize = (): void => {
    centerImageAtScale(1);
  };

  const setPanCursor = (): void => {
    const canvas = canvasRef.value;
    if (!canvas) {
      return;
    }

    if (isPanning) {
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (activeTool.value !== 'select' && !isSpacePressed) {
      canvas.style.cursor = 'crosshair';
      return;
    }

    canvas.style.cursor = isSpacePressed ? 'grab' : 'default';
  };

  /**
   * Converts pointer coordinates from viewport space into image/world space.
   */
  const screenToWorld = (screenX: number, screenY: number): Point => ({
    x: (screenX - camera.offsetX) / camera.scale,
    y: (screenY - camera.offsetY) / camera.scale,
  });

  const applyZoom = (nextScale: number, anchorX: number, anchorY: number): void => {
    if (!imageElement || nextScale === camera.scale) {
      return;
    }

    const clampedScale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
    if (clampedScale === camera.scale) {
      return;
    }

    const worldX = (anchorX - camera.offsetX) / camera.scale;
    const worldY = (anchorY - camera.offsetY) / camera.scale;
    camera.scale = clampedScale;
    camera.offsetX = anchorX - worldX * clampedScale;
    camera.offsetY = anchorY - worldY * clampedScale;
    updateZoomPercent();
    requestRender();
  };

  const zoomAtCenter = (factor: number): void => {
    const canvas = canvasRef.value;
    if (!canvas) {
      return;
    }
    const nextScale = camera.scale * factor;
    applyZoom(nextScale, canvas.clientWidth / 2, canvas.clientHeight / 2);
  };

  const zoomIn = (): void => zoomAtCenter(ZOOM_FACTOR);
  const zoomOut = (): void => zoomAtCenter(1 / ZOOM_FACTOR);
  const setZoomPercent = (percent: number): void => {
    const canvas = canvasRef.value;
    if (!canvas) {
      return;
    }
    const normalizedScale = clamp(percent / 100, MIN_ZOOM, MAX_ZOOM);
    applyZoom(normalizedScale, canvas.clientWidth / 2, canvas.clientHeight / 2);
  };

  const handleWheel = (event: WheelEvent): void => {
    if (!imageElement) {
      return;
    }

    const canvas = canvasRef.value;
    if (!canvas) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const cursorX = event.clientX - bounds.left;
    const cursorY = event.clientY - bounds.top;

    const zoomRatio = event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    applyZoom(camera.scale * zoomRatio, cursorX, cursorY);
  };

  const startPan = (mouseX: number, mouseY: number): void => {
    isPanning = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    setPanCursor();
  };

  const handleMouseDown = (event: MouseEvent): void => {
    if (!imageElement) {
      return;
    }

    const isMiddleButton = event.button === 1;
    const isSpacePan = event.button === 0 && isSpacePressed;
    const isPrimaryDrawing = event.button === 0 && !isSpacePressed && activeTool.value !== 'select';

    if (isPrimaryDrawing) {
      const canvas = canvasRef.value;
      if (!canvas) {
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      drawingStartPoint = screenToWorld(event.clientX - bounds.left, event.clientY - bounds.top);
      isDrawing = true;
      canvasStore.clearDraftElement();
      return;
    }

    if (!isMiddleButton && !isSpacePan) {
      return;
    }

    event.preventDefault();
    startPan(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: MouseEvent): void => {
    if (isDrawing && drawingStartPoint) {
      const canvas = canvasRef.value;
      if (!canvas) {
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      const currentPoint = screenToWorld(event.clientX - bounds.left, event.clientY - bounds.top);
      const nextDraft = createCanvasElementDraft(
        activeTool.value,
        drawingStartPoint,
        currentPoint,
        {
          strokeColor: canvasStore.strokeColor,
          strokeWidth: canvasStore.strokeWidth,
        },
        canvasStore.createElementId(),
      );
      canvasStore.setDraftElement(nextDraft);
      requestRender();
      return;
    }

    if (!isPanning) {
      return;
    }

    const dx = event.clientX - lastMouseX;
    const dy = event.clientY - lastMouseY;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    camera.offsetX += dx;
    camera.offsetY += dy;
    requestRender();
  };

  const stopPan = (): void => {
    if (!isPanning) {
      return;
    }
    isPanning = false;
    setPanCursor();
  };

  const handleMouseUp = (): void => {
    stopPan();
    finishDrawing();
  };

  const finishDrawing = (): void => {
    if (!isDrawing) {
      return;
    }

    isDrawing = false;
    drawingStartPoint = null;

    if (!draftElement.value) {
      return;
    }

    const minSizePx = 12;
    const minWorldSize = minSizePx / camera.scale;
    if (!isDrawableElement(draftElement.value, minWorldSize)) {
      canvasStore.clearDraftElement();
      requestRender();
      return;
    }

    canvasStore.commitDraftElement();
    requestRender();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      if (isDrawing || draftElement.value) {
        isDrawing = false;
        drawingStartPoint = null;
        canvasStore.clearDraftElement();
        requestRender();
      }
      return;
    }

    if (event.code === 'Space') {
      if (isDrawing) {
        return;
      }
      isSpacePressed = true;
      if (!isPanning) {
        setPanCursor();
      }
    }
  };

  const handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      isSpacePressed = false;
      if (!isPanning) {
        setPanCursor();
      }
    }
  };

  const loadCapturedImage = async (dataUrl: string): Promise<void> => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Falha ao carregar imagem capturada.'));
      element.src = dataUrl;
    });

    imageElement = image;
    fitToView();
  };

  const initialize = (): void => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    resizeObserver = new ResizeObserver(() => {
      requestRender();
    });

    if (canvasContainerRef.value) {
      resizeObserver.observe(canvasContainerRef.value);
    }

    void getCapturedImage()
      .then(async (capturedImage) => {
        if (!capturedImage) {
          return;
        }
        imageUrl.value = capturedImage;
        await loadCapturedImage(capturedImage);
        setPanCursor();
      })
      .catch((error: unknown) => {
        console.error('Falha ao carregar imagem capturada:', error);
      });
  };

  const cleanup = (): void => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    resizeObserver?.disconnect();
  };

  return {
    imageUrl,
    zoomPercent,
    canvasRef,
    canvasContainerRef,
    fitToView,
    resetView,
    zoomIn,
    zoomOut,
    setActualSize,
    setZoomPercent,
    activeTool,
    setActiveTool: (tool: ToolType) => {
      canvasStore.setActiveTool(tool);
      setPanCursor();
      requestRender();
    },
    handleWheel,
    handleMouseDown,
    getOutputDataUrl,
    initialize,
    cleanup,
  };
};
