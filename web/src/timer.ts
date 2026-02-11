export function createTimer() {
  const startedAt = Date.now();
  return {
    elapsedMs() {
      return Date.now() - startedAt;
    },
    elapsedLabel() {
      const ms = Date.now() - startedAt;
      const sec = Math.floor(ms / 1000);
      const min = Math.floor(sec / 60);
      const rem = sec % 60;
      return `${min}m ${rem}s`;
    }
  };
}
