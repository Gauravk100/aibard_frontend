export interface Point {
    x: number;
    y: number;
  }
  
  export interface FreehandElement {
    type: 'freehand';
    points: Point[];
    color: string;
  }
  
  export interface RectangleElement {
    type: 'rectangle';
    points: {
      start: Point;
      width: number;
      height: number;
    };
    color: string;
  }
  
  export interface SquareElement {
    type: 'square';
    points: {
      x: number;
      y: number;
      side: number;
    };
    color: string;
  }
  
  export interface CircleElement {
    type: 'circle';
    points: {
      center: Point;
      radius: number;
    };
    color: string;
  }
  
  export type DrawingElement = FreehandElement | RectangleElement | SquareElement | CircleElement;
  
  export interface GeneratedResult {
    expression: string;
    answer: string;
  }
  
  export interface CalculationResponse {
    expr: string;
    result: string;
    assign: boolean;
  }