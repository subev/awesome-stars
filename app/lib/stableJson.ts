export const stableRecordJson = (record: Record<string, unknown>): string => {
  const keys = Object.keys(record).sort();
  if (keys.length === 0) return "{}";
  const lines = keys.map(
    (key) => `${JSON.stringify(key)}:${JSON.stringify(record[key])}`,
  );
  return `{\n${lines.join(",\n")}\n}`;
};
