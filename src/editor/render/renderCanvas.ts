import type { CanvasElement } from '../types/canvas';

/**
 * Camera used only for the interactive canvas viewport.
 * Export rendering intentionally ignores this transform.
 */
export type CanvasCamera = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type RenderCanvasSceneOptions = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  imageElement: HTMLImageElement | null;
  camera: CanvasCamera;
  elements: CanvasElement[];
  draftElement: CanvasElement | null;
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

export const drawElement = (context: CanvasRenderingContext2D, element: CanvasElement): void => {
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

/**
 * Renders the editor viewport using the current camera transform.
 * The base image and all elements are redrawn on every call.
 */
export const renderCanvasScene = ({
  context,
  width,
  height,
  dpr,
  imageElement,
  camera,
  elements,
  draftElement,
}: RenderCanvasSceneOptions): void => {
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
  elements.forEach((element) => {
    drawElement(context, element);
  });
  if (draftElement) {
    drawElement(context, draftElement);
  }
  context.restore();
};

/**
 * Renders the final image at the captured image size, without zoom or pan.
 */
export const renderOutputCanvas = (
  context: CanvasRenderingContext2D,
  imageElement: HTMLImageElement,
  elements: CanvasElement[],
): void => {
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, imageElement.width, imageElement.height);
  context.drawImage(imageElement, 0, 0);
  elements.forEach((element) => {
    drawElement(context, element);
  });
};
