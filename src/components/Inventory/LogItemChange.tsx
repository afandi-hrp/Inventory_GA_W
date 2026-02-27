import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, ClipboardList, Package, User as UserIcon, Calendar, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Search, Filter, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ItemAuditLogEntry {
  id: string;
  item_id: string;
  action: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_by: string;
  created_at: string;
  profiles: { // Joined user details
    full_name: string;
  };
  items: { // Joined item details
    kode_barang: string;
    nama_barang: string;
  };
}

export default function LogItemChange() {
  const { profile } = useAuth();
  const [auditLogs, setAuditLogs] = useState<ItemAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortColumn, setSortColumn] = useState<'created_at' | 'action' | 'changed_by' | 'kode_barang' | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'UPDATE' | 'DELETE'>('ALL');

  // Modal state for viewing detailed changes
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLogEntryForDetail, setSelectedLogEntryForDetail] = useState<ItemAuditLogEntry | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('item_audit_logs')
        .select('*, profiles(full_name), items(kode_barang, nama_barang, lokasi)', { count: 'exact' });

      if (searchTerm) {
        query = query
          .or(`items.nama_barang.ilike.%${searchTerm}%`)
          .or(`items.kode_barang.ilike.%${searchTerm}%`)
          .or(`items.lokasi.ilike.%${searchTerm}%`)
          .or(`profiles.full_name.ilike.%${searchTerm}%`);
      }

      if (actionFilter !== 'ALL') {
        query = query.eq('action', actionFilter);
      }

      if (sortColumn) {
        const column = sortColumn === 'changed_by' ? 'profiles.full_name' : sortColumn === 'kode_barang' ? 'items.kode_barang' : sortColumn;
        query = query.order(column, { ascending: sortDirection === 'asc' });
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setAuditLogs(data as ItemAuditLogEntry[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, itemsPerPage, sortColumn, sortDirection, searchTerm, actionFilter]);

  const handleSort = (column: 'created_at' | 'action' | 'changed_by' | 'kode_barang') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleOpenDetailModal = (entry: ItemAuditLogEntry) => {
    setSelectedLogEntryForDetail(entry);
    setIsDetailModalOpen(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActionFilter('ALL');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const renderChanges = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null) => {
    if (!oldValues && !newValues) return null;

    const relevantKeys = [
      'kode_barang', 'nama_barang', 'jumlah', 'lokasi', 'deskripsi', 'created_at', 'foto_urls'
    ];

    const displayNames: Record<string, string> = {
      'kode_barang': 'Kode Barang',
      'nama_barang': 'Nama Barang',
      'jumlah': 'Jumlah Barang',
      'lokasi': 'Lokasi',
      'deskripsi': 'Deskripsi',
      'created_at': 'Tanggal',
      'foto_urls': 'Foto URL'
    };

    const allKeys = Array.from(new Set([
      ...(oldValues ? Object.keys(oldValues) : []),
      ...(newValues ? Object.keys(newValues) : []),
    ])).filter(key => relevantKeys.includes(key));

    const formatValue = (key: string, value: any) => {
      if (value === undefined || value === null) return '[N/A]';
      if (key === 'created_at') {
        return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } else if (key === 'foto_urls' && Array.isArray(value) && value.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {value.map((url: string, index: number) => (
              <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                <img src={url} alt={`Foto ${index + 1}`} className="w-16 h-16 object-cover rounded-md" referrerPolicy="no-referrer" />
              </a>
            ))}
          </div>
        );
      }
      return String(value);
    };

    return (
      <div className="space-y-1 text-xs">
        {allKeys.map(key => {
          const oldValue = oldValues ? oldValues[key] : undefined;
          const newValue = newValues ? newValues[key] : undefined;
          const displayName = displayNames[key] || key;

          if (oldValue === newValue) {
            return (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium text-gray-600">{displayName}:</span>
                <span className="text-gray-500">{formatValue(key, newValue)}</span>
              </div>
            );
          } else {
            return (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-800">{displayName}:</span>
                <span className="text-red-600 line-through mr-2">{formatValue(key, oldValue)}</span>
                <span className="text-green-600">{formatValue(key, newValue)}</span>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const getChangeCount = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null) => {
    if (!oldValues && !newValues) return 0;
    const allKeys = Array.from(new Set([
      ...(oldValues ? Object.keys(oldValues) : []),
      ...(newValues ? Object.keys(newValues) : []),
    ]));
    let count = 0;
    for (const key of allKeys) {
      const oldValue = oldValues ? oldValues[key] : undefined;
      const newValue = newValues ? newValues[key] : undefined;
      if (oldValue !== newValue) {
        count++;
      }
    }
    return count;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
        <ClipboardList size={24} className="text-blue-600" />
        <span>Log Item Change</span>
      </h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Cari berdasarkan nama, kode barang, atau lokasi..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex items-center gap-4">
          <select
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as 'ALL' | 'UPDATE' | 'DELETE')}
          >
            <option value="ALL">Semua Aksi</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <button
            onClick={handleClearSearch}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <XCircle size={20} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full divide-y divide-gray-50">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tanggal</span>
                  {sortColumn === 'created_at' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  {sortColumn !== 'created_at' && <ArrowUpDown size={16} className="text-gray-300" />}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('action')}
              >
                <div className="flex items-center space-x-1">
                  <span>Aksi</span>
                  {sortColumn === 'action' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  {sortColumn !== 'action' && <ArrowUpDown size={16} className="text-gray-300" />}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('kode_barang')}
              >
                <div className="flex items-center space-x-1">
                  <span>Kode Barang</span>
                  {sortColumn === 'kode_barang' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  {sortColumn !== 'kode_barang' && <ArrowUpDown size={16} className="text-gray-300" />}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perubahan</th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('changed_by')}
              >
                <div className="flex items-center space-x-1">
                  <span>Diubah Oleh</span>
                  {sortColumn === 'changed_by' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  {sortColumn !== 'changed_by' && <ArrowUpDown size={16} className="text-gray-300" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
                  <p className="text-gray-500">Memuat log audit...</p>
                </td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <ClipboardList size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Tidak ada log perubahan item.</p>
                </td>
              </tr>
            ) : (
              auditLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleOpenDetailModal(entry)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      entry.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    )}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-700 max-w-[150px] truncate">
                    {entry.items?.kode_barang || entry.item_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="text-blue-600 hover:underline">
                      {getChangeCount(entry.old_values, entry.new_values)} Perubahan
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <UserIcon size={18} className="text-gray-400" />
                      <p className="text-sm text-gray-900">{entry.profiles?.full_name || 'Unknown User'}</p>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> sampai <span className="font-medium">{Math.min(page * itemsPerPage, totalCount)}</span> dari <span className="font-medium">{totalCount}</span> log
          </p>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value={5}>5 per halaman</option>
            <option value={10}>10 per halaman</option>
            <option value={20}>20 per halaman</option>
            <option value={50}>50 per halaman</option>
          </select>
        </div>
        <nav
          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination"
        >
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              aria-current={page === pageNumber ? 'page' : undefined}
              className={cn(
                "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                page === pageNumber
                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
              )}
            >
              {pageNumber}
            </button>
          ))}
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="sr-only">Next</span>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </nav>
      </div>

      {/* Detail Log Modal */}
      {isDetailModalOpen && selectedLogEntryForDetail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsDetailModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Detail Perubahan Log</h3>
              <button 
                onClick={() => setIsDetailModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Tanggal:</p>
                  <p className="text-gray-900">{new Date(selectedLogEntryForDetail.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Aksi:</p>
                  <p className="text-gray-900">{selectedLogEntryForDetail.action}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Kode Barang:</p>
                  <p className="text-gray-900">{selectedLogEntryForDetail.items?.kode_barang || selectedLogEntryForDetail.item_id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Diubah Oleh:</p>
                  <p className="text-gray-900">{selectedLogEntryForDetail.profiles?.full_name || 'Unknown User'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Old Values</h4>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                    {renderChanges(selectedLogEntryForDetail.old_values, null)}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">New Values</h4>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                    {renderChanges(null, selectedLogEntryForDetail.new_values)}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
