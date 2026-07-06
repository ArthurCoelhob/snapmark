import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useCanvasStore } from '../stores/canvasStore';
import type { ArrowElement, CanvasElement, CircleElement, Point, RectElement, ToolType } from '../types/canvas';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 6;
const ZOOM_FACTOR = 1.1;

type CameraState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const useEditorCanvas = () => {
  const canvasStore = useCanvasStore();
  const { activeTool, elements, draftElement } = storeToRefs(canvasStore);

  const imageUrl = ref<string | null>(null);
  const zoomPercent = ref(100);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const canvasContainerRef = ref<HTMLElement | null>(null);

  const camera: CameraState = {
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
    if (fitScale <= 0) {
      zoomPercent.value = 100;
      return;
    }
    zoomPercent.value = Math.round((camera.scale / fitScale) * 100);
  };

  const drawArrowHead = (
    context: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    strokeWidth: number,
  ): void => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLength = Math.max(10, strokeWidth * 4);

    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6),
    );
    context.moveTo(toX, toY);
    context.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6),
    );
    context.stroke();
  };

  const drawElement = (context: CanvasRenderingContext2D, element: CanvasElement): void => {
    context.strokeStyle = element.strokeColor;
    context.lineWidth = element.strokeWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (element.type === 'rect') {
      context.strokeRect(element.x, element.y, element.width, element.height);
      return;
    }

    if (element.type === 'circle') {
      context.beginPath();
      context.ellipse(element.cx, element.cy, element.rx, element.ry, 0, 0, Math.PI * 2);
      context.stroke();
      return;
    }

    context.beginPath();
    context.moveTo(element.x1, element.y1);
    context.lineTo(element.x2, element.y2);
    context.stroke();
    drawArrowHead(context, element.x1, element.y1, element.x2, element.y2, element.strokeWidth);
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

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    context.drawImage(imageElement, 0, 0);
    elements.value.forEach((element) => {
      drawElement(context, element);
    });

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

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    if (!imageElement) {
      return;
    }

    context.save();
    context.translate(camera.offsetX, camera.offsetY);
    context.scale(camera.scale, camera.scale);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(imageElement, 0, 0);
    elements.value.forEach((element) => {
      drawElement(context, element);
    });
    if (draftElement.value) {
      drawElement(context, draftElement.value);
    }
    context.restore();
  };

  const fitImageToView = (): void => {
    const container = canvasContainerRef.value;
    if (!container || !imageElement) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scaleX = width / imageElement.width;
    const scaleY = height / imageElement.height;

    fitScale = clamp(Math.min(scaleX, scaleY), MIN_ZOOM, MAX_ZOOM);
    camera.scale = fitScale;
    camera.offsetX = (width - imageElement.width * camera.scale) / 2;
    camera.offsetY = (height - imageElement.height * camera.scale) / 2;
    updateZoomPercent();

    requestRender();
  };

  const clearTransientInteractionState = (): void => {
    isDrawing = false;
    drawingStartPoint = null;
    isPanning = false;
    canvasStore.clearDraftElement();
    setPanCursor();
  };

  const resetView = (): void => {
    clearTransientInteractionState();
    fitImageToView();
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

  const screenToWorld = (screenX: number, screenY: number): Point => ({
    x: (screenX - camera.offsetX) / camera.scale,
    y: (screenY - camera.offsetY) / camera.scale,
  });

  const createDraftShape = (start: Point, current: Point): CanvasElement => {
    const id = canvasStore.createElementId();
    const strokeColor = canvasStore.strokeColor;
    const strokeWidth = canvasStore.strokeWidth;

    if (activeTool.value === 'rect') {
      const rect: RectElement = {
        id,
        type: 'rect',
        strokeColor,
        strokeWidth,
        x: Math.min(start.x, current.x),
        y: Math.min(start.y, current.y),
        width: Math.abs(current.x - start.x),
        height: Math.abs(current.y - start.y),
      };
      return rect;
    }

    if (activeTool.value === 'circle') {
      const circle: CircleElement = {
        id,
        type: 'circle',
        strokeColor,
        strokeWidth,
        cx: (start.x + current.x) / 2,
        cy: (start.y + current.y) / 2,
        rx: Math.abs(current.x - start.x) / 2,
        ry: Math.abs(current.y - start.y) / 2,
      };
      return circle;
    }

    const arrow: ArrowElement = {
      id,
      type: 'arrow',
      strokeColor,
      strokeWidth,
      x1: start.x,
      y1: start.y,
      x2: current.x,
      y2: current.y,
    };
    return arrow;
  };

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
    const normalizedScale = clamp((fitScale * percent) / 100, MIN_ZOOM, MAX_ZOOM);
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
      const nextDraft = createDraftShape(drawingStartPoint, currentPoint);
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
    if (draftElement.value.type === 'rect' && (draftElement.value.width < minWorldSize || draftElement.value.height < minWorldSize)) {
      canvasStore.clearDraftElement();
      requestRender();
      return;
    }
    if (draftElement.value.type === 'circle' && (draftElement.value.rx < minWorldSize / 2 || draftElement.value.ry < minWorldSize / 2)) {
      canvasStore.clearDraftElement();
      requestRender();
      return;
    }
    if (draftElement.value.type === 'arrow') {
      const dx = draftElement.value.x2 - draftElement.value.x1;
      const dy = draftElement.value.y2 - draftElement.value.y1;
      if (Math.hypot(dx, dy) < minWorldSize) {
        canvasStore.clearDraftElement();
        requestRender();
        return;
      }
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
    fitImageToView();
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

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('capturedImage', async (result) => {
        if (!result.capturedImage) {
          return;
        }
        imageUrl.value = result.capturedImage;
        await loadCapturedImage(result.capturedImage);
        setPanCursor();
      });
    }
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
    resetView,
    zoomIn,
    zoomOut,
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
