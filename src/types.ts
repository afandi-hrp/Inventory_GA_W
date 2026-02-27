export interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'user';
  avatar_url: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  kode_barang: string;
  nama_barang: string;
  jumlah_barang: number;
  lokasi: string | null;
  foto_urls: string[];
  deskripsi: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  app_title: string;
  app_logo_url: string;
  login_bg_url: string;
  footer_text: string;
  copyright_text: string;
  primary_color: string;
  secondary_color: string;
}
