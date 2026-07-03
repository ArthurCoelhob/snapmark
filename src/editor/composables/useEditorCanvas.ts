import { ref } from 'vue';

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
  let lastMouseX = 0;
  let lastMouseY = 0;

  const updateZoomPercent = (): void => {
    zoomPercent.value = Math.round(camera.scale * 100);
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

    camera.scale = clamp(Math.min(scaleX, scaleY), MIN_ZOOM, MAX_ZOOM);
    camera.offsetX = (width - imageElement.width * camera.scale) / 2;
    camera.offsetY = (height - imageElement.height * camera.scale) / 2;
    updateZoomPercent();

    requestRender();
  };

  const resetView = (): void => {
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

    canvas.style.cursor = isSpacePressed ? 'grab' : 'default';
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
    const isMiddleButton = event.button === 1;
    const isSpacePan = event.button === 0 && isSpacePressed;
    if (!isMiddleButton && !isSpacePan) {
      return;
    }

    event.preventDefault();
    startPan(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: MouseEvent): void => {
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

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
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
    window.addEventListener('mouseup', stopPan);
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
      });
    }
  };

  const cleanup = (): void => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopPan);
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
    handleWheel,
    handleMouseDown,
    initialize,
    cleanup,
  };
};
