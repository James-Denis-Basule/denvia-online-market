type Point = { label: string; orders: number; revenue: number };

function SimpleLineChart({ points, height = 120 }: { points: Point[]; height?: number }) {
  if (!points || points.length === 0) return <div className="text-sm text-gray-500">No data</div>;

  const values = points.map((p) => p.revenue);
  const max = Math.max(...values, 1);
  const min = 0;
  const width = Math.max(300, points.length * 28);
  const padding = 24;

  const path = points
    .map((p, i) => {
      const x = padding + (i * (width - padding * 2)) / (points.length - 1 || 1);
      const y = padding + (1 - (p.revenue - min) / (max - min || 1)) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <div className="overflow-auto">
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill="#fff" />
        <path d={path} stroke="#3b82f6" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const x = padding + (i * (width - padding * 2)) / (points.length - 1 || 1);
          const y = padding + (1 - (p.revenue - min) / (max - min || 1)) * (height - padding * 2);
          return <circle key={p.label} cx={x} cy={y} r={3} fill="#3b82f6" />;
        })}
      </svg>
      <div className="mt-2 flex gap-2 overflow-auto text-xs text-gray-500">
        {points.map((p) => (
          <div key={p.label} className="whitespace-nowrap px-2">{p.label}</div>
        ))}
      </div>
    </div>
  );
}

export default SimpleLineChart;
