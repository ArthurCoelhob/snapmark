export type ToolType = 'select' | 'arrow' | 'rect' | 'circle';

export type Point = {
  x: number;
  y: number;
};

type ElementBase = {
  id: string;
  type: 'arrow' | 'rect' | 'circle';
  strokeColor: string;
  strokeWidth: number;
};

export type RectElement = ElementBase & {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleElement = ElementBase & {
  type: 'circle';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export type ArrowElement = ElementBase & {
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type CanvasElement = RectElement | CircleElement | ArrowElement;
