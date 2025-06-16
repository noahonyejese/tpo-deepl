export const longestSimilarConsecutive = (
  wordsA: string[],
  wordsB: string[],
  maxGap: number
): number => {
  let maxLen = 0;

  for (let i = 0; i < wordsA.length; i++) {
    for (let j = 0; j < wordsB.length; j++) {
      let k = 0;
      let gaps = 0;
      while (
        i + k < wordsA.length &&
        j + k < wordsB.length &&
        (wordsA[i + k] === wordsB[j + k] || gaps < maxGap)
      ) {
        if (wordsA[i + k] !== wordsB[j + k]) {
          gaps++;
          if (gaps > maxGap) break;
        }
        k++;
        if (k > maxLen) maxLen = k;
      }
    }
  }
  return maxLen;
};

export const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};
