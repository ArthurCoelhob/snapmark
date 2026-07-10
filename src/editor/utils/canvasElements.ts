import type { ArrowElement, CanvasElement, CircleElement, Point, RectElement, ToolType } from '../types/canvas';

export type CanvasElementStyle = {
  strokeColor: string;
  strokeWidth: number;
};

/**
 * Creates the temporary shape shown while the pointer is being dragged.
 */
export const createCanvasElementDraft = (
  tool: ToolType,
  start: Point,
  current: Point,
  style: CanvasElementStyle,
  id: string,
): CanvasElement | null => {
  if (tool === 'rect') {
    const rect: RectElement = {
      id,
      type: 'rect',
      strokeColor: style.strokeColor,
      strokeWidth: style.strokeWidth,
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };
    return rect;
  }

  if (tool === 'circle') {
    const circle: CircleElement = {
      id,
      type: 'circle',
      strokeColor: style.strokeColor,
      strokeWidth: style.strokeWidth,
      cx: (start.x + current.x) / 2,
      cy: (start.y + current.y) / 2,
      rx: Math.abs(current.x - start.x) / 2,
      ry: Math.abs(current.y - start.y) / 2,
    };
    return circle;
  }

  if (tool === 'arrow') {
    const arrow: ArrowElement = {
      id,
      type: 'arrow',
      strokeColor: style.strokeColor,
      strokeWidth: style.strokeWidth,
      x1: start.x,
      y1: start.y,
      x2: current.x,
      y2: current.y,
    };
    return arrow;
  }

  return null;
};

/**
 * Prevents tiny accidental drags from being committed as real elements.
 */
export const isDrawableElement = (element: CanvasElement, minWorldSize: number): boolean => {
  if (element.type === 'rect') {
    return element.width >= minWorldSize && element.height >= minWorldSize;
  }

  if (element.type === 'circle') {
    return element.rx >= minWorldSize / 2 && element.ry >= minWorldSize / 2;
  }

  const dx = element.x2 - element.x1;
  const dy = element.y2 - element.y1;
  return Math.hypot(dx, dy) >= minWorldSize;
};
