import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  app_title: 'StockMaster Pro',
  app_logo_url: '',
  login_bg_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000',
  footer_text: 'Inventory Management System',
  copyright_text: '© 2024 StockMaster Pro. All rights reserved.',
  primary_color: '#3b82f6',
  secondary_color: '#1e293b',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase.from('app_settings').select('key, value');
        if (error) throw error;

        if (data) {
          const newSettings = { ...DEFAULT_SETTINGS };
          data.forEach((item) => {
            if (item.key in newSettings) {
              (newSettings as any)[item.key] = item.value;
            }
          });
          setSettings(newSettings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading };
}
