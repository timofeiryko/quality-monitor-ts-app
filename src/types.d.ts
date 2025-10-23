type StateUpdater<T> = (value: T | ((prev: T) => T)) => void;

interface ReactLike {
  createElement: any;
  useState<T>(initial: T | (() => T)): [T, StateUpdater<T>];
  useEffect(effect: () => void | (() => void), deps?: any[]): void;
  useMemo<T>(factory: () => T, deps?: any[]): T;
  useRef<T>(initial: T): { current: T };
}

interface ReactDOMLike {
  render(element: any, container: Element | DocumentFragment | null): void;
}

declare const React: ReactLike;
declare const ReactDOM: ReactDOMLike;
declare const Chart: any;
declare const Papa: any;
