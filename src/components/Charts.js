import React, { useState } from 'react';

export function BarChartSVG({ data, keys, colors, height = 220 }) {
  const [tooltip, setTooltip] = useState(null);
  const padL = 36, padR = 12, padT = 12, padB = 28;
  const W = 480, H = height;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0))) * 1.1;
  const barW = (chartW / data.length) * 0.6 / keys.length;
  const groupW = chartW / data.length;
  const yTicks = 4;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y = padT + (chartH / yTicks) * i;
          const val = Math.round(maxVal - (maxVal / yTicks) * i);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{val}</text>
            </g>
          );
        })}
        {data.map((d, gi) => {
          const gx = padL + gi * groupW + groupW * 0.2;
          return (
            <g key={gi}>
              {keys.map((k, ki) => {
                const bh = (d[k] / maxVal) * chartH;
                const bx = gx + ki * (barW + 2);
                const by = padT + chartH - bh;
                return (
                  <rect key={k} x={bx} y={by} width={barW} height={bh} fill={colors[ki]} rx="3"
                    style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                    onMouseEnter={() => setTooltip({ x: bx + barW / 2, y: by - 6, label: d.name || d.day, key: k, val: d[k] })}
                    onMouseLeave={() => setTooltip(null)}
                    opacity={tooltip && tooltip.key !== k ? 0.65 : 1}
                  />
                );
              })}
              <text x={gx + (keys.length * (barW + 2)) / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#94A3B8">
                {d.name || d.day}
              </text>
            </g>
          );
        })}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 30} y={tooltip.y - 22} width={60} height={20} rx="4" fill="#1E2845" opacity="0.9" />
            <text x={tooltip.x} y={tooltip.y - 8} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">{tooltip.val}</text>
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
        {keys.map((k, i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i] }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChartSVG({ data, keys, colors, height = 220 }) {
  const [tooltip, setTooltip] = useState(null);
  const padL = 36, padR = 12, padT = 16, padB = 28;
  const W = 480, H = height;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0))) * 1.1;
  const xStep = chartW / (data.length - 1);
  const yTicks = 4;
  const px = i => padL + i * xStep;
  const py = v => padT + chartH - (v / maxVal) * chartH;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y = padT + (chartH / yTicks) * i;
          const val = Math.round(maxVal - (maxVal / yTicks) * i);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{val}</text>
            </g>
          );
        })}
        {keys.map((k, ki) => {
          const pts = data.map((d, i) => `${px(i)},${py(d[k])}`).join(' ');
          return (
            <g key={k}>
              <polyline points={pts} fill="none" stroke={colors[ki]} strokeWidth="2.5"
                strokeDasharray={ki === 2 ? '5,3' : undefined} strokeLinecap="round" strokeLinejoin="round" />
              {data.map((d, i) => (
                <circle key={i} cx={px(i)} cy={py(d[k])} r="4" fill={colors[ki]} stroke="#fff" strokeWidth="1.5"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setTooltip({ x: px(i), y: py(d[k]) - 10, val: d[k], key: k })}
                  onMouseLeave={() => setTooltip(null)} />
              ))}
            </g>
          );
        })}
        {data.map((d, i) => (
          <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#94A3B8">{d.day}</text>
        ))}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 20} y={tooltip.y - 18} width={40} height={18} rx="4" fill="#1E2845" opacity="0.9" />
            <text x={tooltip.x} y={tooltip.y - 5} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">{tooltip.val}</text>
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
        {keys.map((k, i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
            <div style={{ width: 16, height: 3, borderRadius: 2, background: colors[i] }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ data, size = 200 }) {
  const [hov, setHov] = useState(null);
  const cx = size / 2, cy = size / 2, R = size * 0.38, r = size * 0.22;
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -Math.PI / 2;

  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const a1 = angle, a2 = angle + sweep;
    angle = a2;
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
    const ix1 = cx + r * Math.cos(a1), iy1 = cy + r * Math.sin(a1);
    const ix2 = cx + r * Math.cos(a2), iy2 = cy + r * Math.sin(a2);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${large} 0 ${ix1},${iy1} Z`;
    const mid = a1 + sweep / 2;
    return { ...d, path, mid, pct: Math.round(d.value / total * 100) };
  });

  const hSlice = hov !== null ? slices[hov] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => {
          const offset = hov === i ? 6 : 0;
          const tx = Math.cos(s.mid) * offset, ty = Math.sin(s.mid) * offset;
          return (
            <path key={i} d={s.path} fill={s.color}
              transform={`translate(${tx},${ty})`}
              style={{ cursor: 'pointer', transition: 'transform .2s', filter: hov === i ? 'brightness(1.1)' : 'none' }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          );
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#1E2845" fontFamily="Syne,sans-serif">
          {hSlice ? hSlice.pct + '%' : total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#94A3B8">
          {hSlice ? hSlice.name : 'Total'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map((s, i) => (
          <div key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', opacity: hov !== null && hov !== i ? 0.5 : 1, transition: 'opacity .2s' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ color: '#64748B' }}>{s.name}</span>
            <span style={{ fontWeight: 700, color: '#1E2845', marginLeft: 'auto' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
