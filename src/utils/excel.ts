import * as XLSX from 'xlsx';
import { OptionChainStrike } from '../types';

export interface ExcelStrikeRow {
  Date: string;
  Commodity: string;
  'Spot Price': number;
  Strike: number;
  'Option Type': 'CALL' | 'PUT';
  Delta: number;
  Gamma: number;
  Theta: number;
  Vega: number;
  Rho: number;
  IV: number;
  OI: number;
  LTP: number;
}

/**
 * Converts OptionChain strikes into standard tabular format for Excel / CSV
 * Each strike produces two rows (one CALL, one PUT)
 */
export function buildExcelRows(
  commodity: string,
  spotPrice: number,
  expiry: string,
  optionChain: OptionChainStrike[],
  dateStr?: string
): ExcelStrikeRow[] {
  const date = dateStr || new Date().toISOString().split('T')[0];
  const rows: ExcelStrikeRow[] = [];

  for (const item of optionChain) {
    // CALL Row
    rows.push({
      Date: date,
      Commodity: commodity,
      'Spot Price': spotPrice,
      Strike: item.strike,
      'Option Type': 'CALL',
      Delta: item.call.delta,
      Gamma: item.call.gamma,
      Theta: item.call.theta,
      Vega: item.call.vega,
      Rho: item.call.rho,
      IV: item.call.iv,
      OI: item.call.oi,
      LTP: item.call.ltp
    });

    // PUT Row
    rows.push({
      Date: date,
      Commodity: commodity,
      'Spot Price': spotPrice,
      Strike: item.strike,
      'Option Type': 'PUT',
      Delta: item.put.delta,
      Gamma: item.put.gamma,
      Theta: item.put.theta,
      Vega: item.put.vega,
      Rho: item.put.rho,
      IV: item.put.iv,
      OI: item.put.oi,
      LTP: item.put.ltp
    });
  }

  return rows;
}

/**
 * Downloads formatted Excel (.xlsx) file
 */
export function downloadExcelFile(
  commodity: string,
  spotPrice: number,
  expiry: string,
  optionChain: OptionChainStrike[],
  customFilename?: string
): void {
  const rows = buildExcelRows(commodity, spotPrice, expiry, optionChain);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 14 }, // Commodity
    { wch: 12 }, // Spot Price
    { wch: 10 }, // Strike
    { wch: 12 }, // Option Type
    { wch: 10 }, // Delta
    { wch: 12 }, // Gamma
    { wch: 10 }, // Theta
    { wch: 10 }, // Vega
    { wch: 10 }, // Rho
    { wch: 8 },  // IV
    { wch: 10 }, // OI
    { wch: 10 }  // LTP
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${commodity}_Greeks`);

  const filename =
    customFilename ||
    `${commodity.replace(/\s+/g, '_')}_Option_Chain_Greeks_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Downloads formatted CSV file
 */
export function downloadCsvFile(
  commodity: string,
  spotPrice: number,
  expiry: string,
  optionChain: OptionChainStrike[],
  customFilename?: string
): void {
  const rows = buildExcelRows(commodity, spotPrice, expiry, optionChain);
  const headers = [
    'Date',
    'Commodity',
    'Spot Price',
    'Strike',
    'Option Type',
    'Delta',
    'Gamma',
    'Theta',
    'Vega',
    'Rho',
    'IV',
    'OI',
    'LTP'
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.Date,
        `"${r.Commodity}"`,
        r['Spot Price'],
        r.Strike,
        r['Option Type'],
        r.Delta,
        r.Gamma,
        r.Theta,
        r.Vega,
        r.Rho,
        r.IV,
        r.OI,
        r.LTP
      ].join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    customFilename ||
      `${commodity.replace(/\s+/g, '_')}_Option_Chain_Greeks_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface GreeksReportExportData {
  commodity: string;
  spotPrice: number;
  strike: number;
  optionType: 'CE' | 'PE';
  expiry: number;
  iv: number;
  lots: number;
  lotSize: number;
  mode: string;
  calculatedGreeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    pop: number;
    premium: number;
    breakeven: number;
    intrinsicValue: number;
    extrinsicValue: number;
  };
  marketGreeks?: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    pop: number;
    premium: number;
    source?: string;
  };
  scenarioRows: Array<{
    priceMove: number;
    newPrice: number;
    premium: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    pnl: number;
  }>;
}

/**
 * Export Greeks Calculation and Scenario Analysis report as Excel workbook (.xlsx)
 */
export function exportGreeksReportExcel(data: GreeksReportExportData): void {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['MCX COMMODITY GREEKS ANALYSIS REPORT'],
    ['Generated At', new Date().toLocaleString()],
    ['Calculation Mode', data.mode.toUpperCase()],
    [''],
    ['PARAMETER', 'VALUE'],
    ['Commodity', data.commodity],
    ['Spot Price (INR)', data.spotPrice],
    ['Strike Price (INR)', data.strike],
    ['Option Type', data.optionType],
    ['Expiry (Days)', data.expiry],
    ['Implied Volatility (%)', data.iv],
    ['Lots', data.lots],
    ['Lot Size', data.lotSize],
    ['Total Contract Size', data.lots * data.lotSize],
    [''],
    ['METRIC', 'THEORETICAL (B&S)', 'MARKET GREEKS', 'DIFFERENCE'],
    [
      'Option Premium (INR)',
      data.calculatedGreeks.premium,
      data.marketGreeks?.premium ?? 'N/A',
      data.marketGreeks ? (data.marketGreeks.premium - data.calculatedGreeks.premium).toFixed(2) : 'N/A'
    ],
    [
      'Delta (Δ)',
      data.calculatedGreeks.delta,
      data.marketGreeks?.delta ?? 'N/A',
      data.marketGreeks ? (data.marketGreeks.delta - data.calculatedGreeks.delta).toFixed(4) : 'N/A'
    ],
    [
      'Gamma (Γ)',
      data.calculatedGreeks.gamma,
      data.marketGreeks?.gamma ?? 'N/A',
      data.marketGreeks ? (data.marketGreeks.gamma - data.calculatedGreeks.gamma).toFixed(6) : 'N/A'
    ],
    [
      'Theta (θ daily)',
      data.calculatedGreeks.theta,
      data.marketGreeks?.theta ?? 'N/A',
      data.marketGreeks ? (data.marketGreeks.theta - data.calculatedGreeks.theta).toFixed(2) : 'N/A'
    ],
    [
      'Vega (ν)',
      data.calculatedGreeks.vega,
      data.marketGreeks?.vega ?? 'N/A',
      data.marketGreeks ? (data.marketGreeks.vega - data.calculatedGreeks.vega).toFixed(2) : 'N/A'
    ],
    [
      'Rho (ρ)',
      data.calculatedGreeks.rho,
      data.marketGreeks?.rho ?? 'N/A',
      data.marketGreeks ? (data.marketGreeks.rho - data.calculatedGreeks.rho).toFixed(2) : 'N/A'
    ],
    [
      'POP (Probability of Profit %)',
      `${data.calculatedGreeks.pop}%`,
      data.marketGreeks?.pop ? `${data.marketGreeks.pop}%` : 'N/A',
      data.marketGreeks ? `${(data.marketGreeks.pop - data.calculatedGreeks.pop).toFixed(1)}%` : 'N/A'
    ],
    ['Breakeven Spot Price', data.calculatedGreeks.breakeven, 'N/A', 'N/A'],
    ['Intrinsic Value', data.calculatedGreeks.intrinsicValue, 'N/A', 'N/A'],
    ['Extrinsic (Time) Value', data.calculatedGreeks.extrinsicValue, 'N/A', 'N/A']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Greeks_Summary');

  // Scenario sheet
  const scenarioHeaders = [
    'Price Move (Pts)',
    'New Price (INR)',
    'Premium (INR)',
    'Delta (Δ)',
    'Gamma (Γ)',
    'Theta (θ)',
    'Vega (ν)',
    'Rho (ρ)',
    'P&L (INR)'
  ];

  const scenarioData = [
    scenarioHeaders,
    ...data.scenarioRows.map((row) => [
      row.priceMove > 0 ? `+${row.priceMove}` : row.priceMove,
      row.newPrice,
      row.premium,
      row.delta,
      row.gamma,
      row.theta,
      row.vega,
      row.rho,
      row.pnl
    ])
  ];

  const wsScenario = XLSX.utils.aoa_to_sheet(scenarioData);
  XLSX.utils.book_append_sheet(wb, wsScenario, 'Price_Move_Scenarios');

  const fileName = `${data.commodity.replace(/\s+/g, '_')}_${data.strike}_${data.optionType}_Greeks_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export Greeks Calculation as CSV
 */
export function exportGreeksReportCsv(data: GreeksReportExportData): void {
  const lines: string[] = [];
  lines.push('SCENARIO TABLE');
  lines.push('Price Move,New Price,Premium,Delta,Gamma,Theta,Vega,Rho,P&L');

  data.scenarioRows.forEach((row) => {
    lines.push(
      [
        row.priceMove > 0 ? `+${row.priceMove}` : row.priceMove,
        row.newPrice,
        row.premium,
        row.delta,
        row.gamma,
        row.theta,
        row.vega,
        row.rho,
        row.pnl
      ].join(',')
    );
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${data.commodity.replace(/\s+/g, '_')}_${data.strike}_${data.optionType}_Scenarios.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger clean institutional styled PDF printable report
 */
export function printOrDownloadPdfReport(data: GreeksReportExportData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${data.commodity} ${data.strike} ${data.optionType} - Commodity Greeks Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 30px;
      margin: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #00778A;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 22px;
      font-weight: 800;
      color: #00778A;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      margin-top: 4px;
    }
    .meta {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .card-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .card-val {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th {
      background: #00778A;
      color: #ffffff;
      text-align: left;
      padding: 8px 12px;
      font-weight: 600;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .pos { color: #16a34a; font-weight: 600; }
    .neg { color: #dc2626; font-weight: 600; }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 20px 0 10px 0;
      border-left: 4px solid #00778A;
      padding-left: 8px;
    }
    @media print {
      body { padding: 15px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">COMMODITY GREEKS PRO</div>
      <div style="font-size: 14px; font-weight: 600; margin-top: 4px;">Institutional Options Risk & Scenario Report</div>
      <span class="badge">MODE: ${data.mode.toUpperCase()}</span>
    </div>
    <div class="meta">
      <div><strong>Commodity:</strong> ${data.commodity}</div>
      <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
      <div><strong>Contracts:</strong> ${data.lots} Lots × ${data.lotSize} (${data.lots * data.lotSize} Units)</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">Spot Price</div>
      <div class="card-val">₹${data.spotPrice.toLocaleString('en-IN')}</div>
    </div>
    <div class="card">
      <div class="card-label">Strike Price</div>
      <div class="card-val">₹${data.strike.toLocaleString('en-IN')} ${data.optionType}</div>
    </div>
    <div class="card">
      <div class="card-label">Option Premium</div>
      <div class="card-val">₹${data.calculatedGreeks.premium.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">POP (Prob. of Profit)</div>
      <div class="card-val" style="color: #00778A;">${data.calculatedGreeks.pop}%</div>
    </div>
  </div>

  <div class="section-title">Greeks Matrix (Theoretical vs Market)</div>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Theoretical (B&S)</th>
        <th>Market Greeks</th>
        <th>Difference</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Delta (Δ)</strong></td>
        <td>${data.calculatedGreeks.delta}</td>
        <td>${data.marketGreeks ? data.marketGreeks.delta : '—'}</td>
        <td class="${data.marketGreeks && data.marketGreeks.delta >= data.calculatedGreeks.delta ? 'pos' : 'neg'}">
          ${data.marketGreeks ? (data.marketGreeks.delta - data.calculatedGreeks.delta >= 0 ? '+' : '') + (data.marketGreeks.delta - data.calculatedGreeks.delta).toFixed(4) : '—'}
        </td>
      </tr>
      <tr>
        <td><strong>Gamma (Γ)</strong></td>
        <td>${data.calculatedGreeks.gamma}</td>
        <td>${data.marketGreeks ? data.marketGreeks.gamma : '—'}</td>
        <td>${data.marketGreeks ? (data.marketGreeks.gamma - data.calculatedGreeks.gamma).toFixed(6) : '—'}</td>
      </tr>
      <tr>
        <td><strong>Theta (θ Daily)</strong></td>
        <td>₹${data.calculatedGreeks.theta}</td>
        <td>${data.marketGreeks ? '₹' + data.marketGreeks.theta : '—'}</td>
        <td>${data.marketGreeks ? (data.marketGreeks.theta - data.calculatedGreeks.theta).toFixed(2) : '—'}</td>
      </tr>
      <tr>
        <td><strong>Vega (ν per 1% IV)</strong></td>
        <td>₹${data.calculatedGreeks.vega}</td>
        <td>${data.marketGreeks ? '₹' + data.marketGreeks.vega : '—'}</td>
        <td>${data.marketGreeks ? (data.marketGreeks.vega - data.calculatedGreeks.vega).toFixed(2) : '—'}</td>
      </tr>
      <tr>
        <td><strong>Rho (ρ per 1% Rate)</strong></td>
        <td>₹${data.calculatedGreeks.rho}</td>
        <td>${data.marketGreeks ? '₹' + data.marketGreeks.rho : '—'}</td>
        <td>${data.marketGreeks ? (data.marketGreeks.rho - data.calculatedGreeks.rho).toFixed(2) : '—'}</td>
      </tr>
      <tr>
        <td><strong>Breakeven Spot</strong></td>
        <td>₹${data.calculatedGreeks.breakeven.toLocaleString('en-IN')}</td>
        <td>—</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Price Movement Scenario Analysis Matrix (-2,000 to +2,000 Points)</div>
  <table>
    <thead>
      <tr>
        <th>Price Move</th>
        <th>New Price (₹)</th>
        <th>Premium (₹)</th>
        <th>Delta</th>
        <th>Gamma</th>
        <th>Theta</th>
        <th>Vega</th>
        <th>P&L (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${data.scenarioRows
        .map(
          (r) => `
      <tr>
        <td><strong>${r.priceMove > 0 ? '+' + r.priceMove : r.priceMove}</strong></td>
        <td>₹${r.newPrice.toLocaleString('en-IN')}</td>
        <td>₹${r.premium.toFixed(2)}</td>
        <td>${r.delta.toFixed(4)}</td>
        <td>${r.gamma.toFixed(5)}</td>
        <td>₹${r.theta.toFixed(2)}</td>
        <td>₹${r.vega.toFixed(2)}</td>
        <td class="${r.pnl >= 0 ? 'pos' : 'neg'}">₹${r.pnl.toLocaleString('en-IN')}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center;">
    Commodity Greeks Pro Engine • Black-Scholes Model with Continuous Dividends / Cost-of-Carry • For Institutional & Active Derivatives Analysis
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
`;

  printWindow.document.write(html);
  printWindow.document.close();
}

