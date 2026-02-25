declare module "wordcloud2/src/wordcloud2.js" {
  interface Options {
    list?: [string, number][];
    fontFamily?: string;
    fontWeight?: string | number;
    color?:
      | string
      | ((
          word: string,
          weight: string | number,
          fontSize: number,
          distance: number,
          theta: number,
        ) => string);
    gridSize?: number;
    weightFactor?: number | ((size: number) => number);
    rotateRatio?: number;
    minRotation?: number;
    maxRotation?: number;
    backgroundColor?: string;
    shrinkToFit?: boolean;
  }

  function WordCloud(element: HTMLCanvasElement | HTMLElement, options: Options): void;
  export default WordCloud;
}
