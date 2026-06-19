export interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'user' | 'auditor';
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  nama_kategori: string;
  deskripsi: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: string;
  kode_barang: string;
  nama_barang: string;
  jumlah_barang: number;
  kode_lokasi: string | null;
  kategori_id: string | null;
  foto_urls: string[];
  deskripsi: string | null;
  kelengkapan_garansi?: boolean;
  kelengkapan_sertifikat?: boolean;
  kelengkapan_manual?: boolean;
  note_audit?: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface Location {
  kode_lokasi: string;
  nama_lokasi: string;
  created_at?: string;
}

export interface StockKeluarHistory {
  id: string;
  original_item_id: string | null;
  kode_barang: string;
  nama_barang: string;
  jumlah_barang: number;
  lokasi: string | null;
  nama_lokasi: string | null;
  lokasi_keluar: string | null;
  foto_urls: string[];
  deskripsi: string | null;
  tanggal_keluar: string;
  keterangan_alasan: string;
  user_name: string | null;
  created_at: string;
}

export interface AppSettings {
  id?: number;
  login_title: string;
  login_footer: string;
  login_bg_url: string;
  updated_at?: string;
}
