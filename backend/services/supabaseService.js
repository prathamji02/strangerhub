import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// You need the Service Role Key to bypass RLS for uploads from the backend.
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const uploadIdCard = async (fileBuffer, originalName, mimeType) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env');
  }

  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${originalName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  
  const { data, error } = await supabase.storage
    .from('id-cards')
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('id-cards')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};
