// SVG paths for small line charts. series: [{ values }]. All series share one
// scale, so lines can be compared. Values spread evenly across width and fit
// height with `pad` of room at the top and bottom. A series of one value
// draws a flat line; an empty one gives "".
export function sharedPaths(series, width, height, pad = 4) {
  const { y } = chartScale(series, height, pad);
  return series.map(({ values }) => {
    if (!values.length) return "";
    const points = values.length > 1 ? values : [values[0], values[0]];
    const step = width / (points.length - 1);
    return points
      .map((value, i) => `${i ? "L" : "M"}${round(i * step)} ${round(y(value))}`)
      .join(" ");
  });
}

// The shared scale of the series: the lowest and highest value, and y(value),
// where a value sits from the top. All equal values sit in the middle.
export function chartScale(series, height, pad = 4) {
  const all = series.flatMap((s) => s.values);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const y = (value) =>
    max === min ? height / 2 : pad + (1 - (value - min) / (max - min)) * (height - pad * 2);
  return { min, max, y };
}

// One line on its own scale.
export function linePath(values, width, height, pad = 4) {
  return sharedPaths([{ values }], width, height, pad)[0];
}

function round(n) {
  return Math.round(n * 10) / 10;
}
