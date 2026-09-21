import React, { useState, useEffect } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { usePriceStore } from '../../store/priceStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { downloadExcelFile } from '../../utils/excel';
import {
  History,
  Search,
  Download,
  Trash2,
  Filter,
  RefreshCw,
  Database,
  Eye,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const {
    history,
    fetchHistoryFromBackend,
    deleteHistoryUpload,
    loadHistoryUpload,
    clearHistory,
    databaseStatus,
    isSyncingApi
  } = useGreeksStore();

  const { currentPrice: liveGoldPrice, changePercent: liveChangePercent } = usePriceStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [commodityFilter, setCommodityFilter] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoryFromBackend();
  }, [fetchHistoryFromBackend]);

  const filteredUploads = history.filter((item) => {
    const matchesCommodity =
      commodityFilter === 'ALL' || item.commodity.toUpperCase() === commodityFilter.toUpperCase();
    const matchesSearch =
      item.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uploadType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uploadDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.price.toString().includes(searchTerm);
    return matchesCommodity && matchesSearch;
  });

  const handleDownloadExcel = (item: (typeof history)[0]) => {
    downloadExcelFile(
      item.commodity,
      item.price,
      item.expiry,
      item.optionChainData,
      `${item.commodity}_Upload_${item.uploadId}.xlsx`
    );
    setStatusMessage(`Downloaded ${item.commodity} Excel file.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDelete = async (uploadId: string) => {
    if (window.confirm('Delete this upload record from database?')) {
      await deleteHistoryUpload(uploadId);
      setStatusMessage('Upload record deleted successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleView = (uploadId: string) => {
    loadHistoryUpload(uploadId);
    setStatusMessage('Loaded upload into active workspace.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#121E2A]/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00778A]/10 text-[#00778A] dark:text-[#38BDF8] flex items-center justify-center font-bold">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#1D2939] dark:text-[#F0F6F9]">
                  Uploaded Option Chains & Greeks Archive
                </h2>
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#12B76A]/10 text-[#12B76A] border border-[#12B76A]/20">
                  <Database className="w-3 h-3" />
                  <span>{databaseStatus.driver === 'mongodb' ? 'MongoDB' : 'Persistent Storage'} Connected</span>
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#8899A6] mt-0.5">
                Displays all ingested Option Chain screenshots, TradingView captures, CSVs, and Excel files ({history.length} records)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Gold Price Synchronized Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7FAFB] dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
              <span className="text-[#667085] dark:text-[#94A3B8]">Live Gold:</span>
              <strong className="font-mono text-[#1D2939] dark:text-white">₹{liveGoldPrice.toLocaleString('en-IN')}</strong>
              <span className={`text-[10px] font-semibold ${liveChangePercent >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                ({liveChangePercent >= 0 ? '+' : ''}{liveChangePercent}%)
              </span>
            </div>

            <button
              onClick={() => fetchHistoryFromBackend()}
              disabled={isSyncingApi}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] text-[#1D2939] dark:text-[#F0F6F9] hover:bg-[#F7FAFB] dark:hover:bg-[#223344] text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
              title="Refresh records from MongoDB"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingApi ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all historical records?')) {
                    clearHistory();
                  }
                }}
                className="p-2 rounded-xl bg-white dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-red-950/30 transition-colors"
                title="Clear All History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-[#12B76A]/10 border border-[#12B76A]/30 text-xs text-[#12B76A] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mt-6 pt-5 border-t border-[#DCE9EE]/60 dark:border-[#223344] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search uploads by commodity, type, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] text-xs text-[#1D2939] dark:text-[#F0F6F9] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#667085] dark:text-[#8899A6] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] text-xs font-semibold text-[#1D2939] dark:text-[#F0F6F9] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 shadow-xs"
            >
              <option value="ALL">All Commodities</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="CRUDEOIL">Crude Oil</option>
              <option value="NATURALGAS">Natural Gas</option>
              <option value="COPPER">Copper</option>
              <option value="ZINC">Zinc</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table (Display All Uploads) */}
      <div className="bg-white/90 dark:bg-[#121E2A]/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-sm overflow-hidden">
        {filteredUploads.length === 0 ? (
          <div className="py-12 text-center">
            <History className="w-12 h-12 text-[#B5CEDA] dark:text-[#475467] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1D2939] dark:text-[#F0F6F9]">No uploads found</h3>
            <p className="text-xs text-[#667085] dark:text-[#8899A6] mt-1 max-w-sm mx-auto">
              Upload an Option Chain screenshot, TradingView chart, CSV, or Excel file in the Upload Center to track them here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#DCE9EE] dark:border-[#223344] text-[#667085] dark:text-[#8899A6] text-[11px] uppercase tracking-wider bg-[#F7FAFB]/70 dark:bg-[#1A2936]/70 font-semibold">
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Strikes</th>
                  <th className="py-3 px-4">Greeks</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE9EE]/60 dark:divide-[#223344]/60">
                {filteredUploads.map((item) => (
                  <tr
                    key={item.uploadId}
                    className="hover:bg-[#F7FAFB] dark:hover:bg-[#1A2936]/50 transition-colors group"
                  >
                    {/* Upload Date */}
                    <td className="py-3.5 px-4 text-[#1D2939] dark:text-[#F0F6F9]">
                      <div className="font-semibold text-xs">{item.uploadDate}</div>
                    </td>

                    {/* Commodity */}
                    <td className="py-3.5 px-4 font-bold text-[#00778A] dark:text-[#38BDF8]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00778A] dark:bg-[#38BDF8]" />
                        <span>{item.commodity}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1D2939] dark:text-[#F0F6F9]">
                      ₹{item.price.toLocaleString('en-IN')}
                    </td>

                    {/* Strikes */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.strikes}
                      </span>
                    </td>

                    {/* Greeks */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40 inline-block">
                        {item.greeks}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded font-medium text-[10px] bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        {item.uploadType}
                      </span>
                    </td>

                    {/* Actions: View, Download Excel, Delete */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Action */}
                        <button
                          onClick={() => handleView(item.uploadId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#00778A]/10 text-[#00778A] dark:text-[#38BDF8] hover:bg-[#00778A]/20 transition-colors"
                          title="Load into active workspace & view on Dashboard"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        {/* Download Excel Action */}
                        <button
                          onClick={() => handleDownloadExcel(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#12B76A]/10 text-[#12B76A] hover:bg-[#12B76A]/20 transition-colors"
                          title="Download Excel (.xlsx) file"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Download Excel</span>
                        </button>

                        {/* Delete Action */}
                        <button
                          onClick={() => handleDelete(item.uploadId)}
                          className="p-1.5 rounded-lg text-[#F04438] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete record from MongoDB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
