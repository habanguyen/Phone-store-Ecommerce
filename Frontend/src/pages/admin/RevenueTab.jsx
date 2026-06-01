import React from 'react';

const RevenueTab = ({
  selectedYear,
  setSelectedYear,
  chartType,
  setChartType,
  exportRevenue,
  reportError,
  report,
  revenueData,
  hoveredIndex,
  setHoveredIndex,
  formatCurrency
}) => {
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="adm-card">
        <div className="adm-card-title" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <h3>Báo Cáo Doanh Thu Năm {selectedYear}</h3>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="adm-input adm-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ width: '130px', padding: '8px 12px' }}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y} style={{ background: '#121215', color: '#fff' }}>
                  Năm {y}
                </option>
              ))}
            </select>

            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '4px',
                border: '1px solid var(--adm-border)'
              }}
            >
              <button
                type="button"
                className="adm-btn adm-btn-small"
                onClick={() => setChartType('bar')}
                style={{
                  borderRadius: '6px',
                  padding: '6px 12px',
                  backgroundColor: chartType === 'bar' ? 'var(--adm-primary)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  boxShadow: chartType === 'bar' ? '0 2px 6px var(--adm-primary-glow)' : 'none'
                }}
              >
                Cột
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-small"
                onClick={() => setChartType('line')}
                style={{
                  borderRadius: '6px',
                  padding: '6px 12px',
                  backgroundColor: chartType === 'line' ? 'var(--adm-primary)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  boxShadow: chartType === 'line' ? '0 2px 6px var(--adm-primary-glow)' : 'none'
                }}
              >
                Đường
              </button>
            </div>

            <button className="adm-btn adm-btn-primary adm-btn-small" onClick={exportRevenue}>
              Xuất Excel
            </button>
          </div>
        </div>

        {reportError && (
          <div className="alert error" style={{ marginBottom: '20px' }}>
            {reportError}
          </div>
        )}

        {report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Report Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px'
              }}
            >
              <div
                style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid var(--adm-border)',
                  borderLeft: '4px solid var(--adm-primary)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Doanh Thu Tích Lũy Năm {selectedYear}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                  {formatCurrency(revenueData.reduce((sum, item) => sum + item.revenue, 0))}
                </div>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid var(--adm-border)',
                  borderLeft: '4px solid var(--adm-success)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Số Đơn Hàng Thành Công
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                  {revenueData.reduce((sum, item) => sum + item.orders, 0)} đơn
                </div>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid var(--adm-border)',
                  borderLeft: '4px solid var(--adm-info)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Giá Trị Đơn Trung Bình
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                  {formatCurrency(
                    (() => {
                      const totalOrders = revenueData.reduce((sum, item) => sum + item.orders, 0);
                      const totalRev = revenueData.reduce((sum, item) => sum + item.revenue, 0);
                      return totalOrders ? totalRev / totalOrders : 0;
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Custom SVG Chart */}
            <div
              style={{
                border: '1px solid var(--adm-border)',
                borderRadius: '12px',
                padding: '24px',
                background: 'rgba(0, 0, 0, 0.15)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <h4 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#fff' }}>
                  Biểu Đồ Xu Hướng Doanh Thu Hàng Tháng ({selectedYear})
                </h4>
                
                {/* Interactive Tooltip Details */}
                <div style={{ fontSize: '13.5px', height: '24px' }}>
                  {hoveredIndex !== null && revenueData[hoveredIndex] ? (
                    <span style={{ color: 'var(--adm-primary-hover)', fontWeight: '700' }}>
                      Tháng {(revenueData[hoveredIndex]?.label || '').split('-')[1] || ''}:{' '}
                      {formatCurrency(revenueData[hoveredIndex]?.revenue)} ({revenueData[hoveredIndex]?.orders || 0} đơn)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--adm-text-darker)', fontSize: '12.5px', fontStyle: 'italic' }}>
                      Di chuột vào biểu đồ để xem chi tiết tháng
                    </span>
                  )}
                </div>
              </div>

              {revenueData.length > 0 ? (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <svg viewBox="0 0 800 320" width="100%" height="320" style={{ display: 'block', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--adm-primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--adm-primary)" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--adm-primary)" floodOpacity="0.4"/>
                      </filter>
                    </defs>

                    {/* Y Axis Grid Lines */}
                    {(() => {
                      const maxRev = Math.max(...revenueData.map((d) => d.revenue), 100000);
                      const getY = (val) => 270 - (val / maxRev) * 230;
                      const formatYAxisLabel = (value) => {
                        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
                        if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
                        if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
                        return value;
                      };

                      return [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const val = ratio * maxRev;
                        const y = getY(val);
                        return (
                          <g key={ratio}>
                            <line x1="80" y1={y} x2="770" y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                            <text x="70" y={y + 4} fill="var(--adm-text-darker)" fontSize="11" fontWeight="600" textAnchor="end">
                              {formatYAxisLabel(val)}
                            </text>
                          </g>
                        );
                      });
                    })()}

                    {/* X Axis Labels */}
                    {revenueData.map((item, index) => {
                      const x = 80 + (index * 690) / Math.max(revenueData.length - 1, 1);
                      const parts = (item?.label || '').split('-');
                      const label = parts[1] ? `Tháng ${parseInt(parts[1])}` : item?.label || '';
                      return (
                        <text key={index} x={x} y="295" fill="var(--adm-text-darker)" fontSize="11" fontWeight="600" textAnchor="middle">
                          {label}
                        </text>
                      );
                    })}

                    {/* SVG Graphic Elements */}
                    {(() => {
                      const maxRev = Math.max(...revenueData.map((d) => d.revenue), 100000);
                      const getX = (idx) => 80 + (idx * 690) / Math.max(revenueData.length - 1, 1);
                      const getY = (val) => 270 - (val / maxRev) * 230;

                      if (chartType === 'bar') {
                        return revenueData.map((item, index) => {
                          const x = getX(index);
                          const y = getY(item.revenue);
                          const barWidth = Math.max((690 / (revenueData.length || 1)) * 0.4, 16);
                          const rectX = x - barWidth / 2;
                          const rectHeight = Math.max(270 - y, 4);
                          const isHovered = hoveredIndex === index;

                          return (
                            <rect
                              key={index}
                              x={rectX}
                              y={y}
                              width={barWidth}
                              height={rectHeight}
                              rx="4"
                              fill={isHovered ? 'var(--adm-primary-hover)' : 'var(--adm-primary)'}
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                opacity: isHovered ? 1 : 0.75,
                                filter: isHovered ? 'url(#glow)' : 'none'
                              }}
                              onMouseEnter={() => setHoveredIndex(index)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            />
                          );
                        });
                      } else {
                        const pathPoints = revenueData
                          .map((d, index) => {
                            const x = getX(index);
                            const y = getY(d.revenue);
                            return `${x},${y}`;
                          })
                          .join(' ');

                        const areaPoints = `80,270 ${pathPoints} ${getX(revenueData.length - 1)},270`;

                        return (
                          <g>
                            {/* Area Gradient fill */}
                            <path d={`M ${areaPoints}`} fill="url(#areaGrad)" style={{ transition: 'all 0.3s ease' }} />
                            
                            {/* Line path with glow */}
                            <path
                              d={revenueData
                                .map((item, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(item.revenue)}`)
                                .join(' ')}
                              fill="none"
                              stroke="var(--adm-primary)"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter="url(#glow)"
                              style={{ transition: 'all 0.3s ease' }}
                            />

                            {/* Circle Node Markers */}
                            {revenueData.map((item, index) => {
                              const x = getX(index);
                              const y = getY(item.revenue);
                              const isHovered = hoveredIndex === index;

                              return (
                                <circle
                                  key={index}
                                  cx={x}
                                  cy={y}
                                  r={isHovered ? 8 : 5}
                                  fill={isHovered ? '#fff' : 'var(--adm-primary)'}
                                  stroke={isHovered ? 'var(--adm-primary)' : 'rgba(255,255,255,0.8)'}
                                  strokeWidth="2.5"
                                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                  onMouseEnter={() => setHoveredIndex(index)}
                                  onMouseLeave={() => setHoveredIndex(null)}
                                />
                              );
                            })}
                          </g>
                        );
                      }
                    })()}
                  </svg>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--adm-text-darker)', padding: '40px' }}>
                  Không có dữ liệu hiển thị biểu đồ.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueTab;
