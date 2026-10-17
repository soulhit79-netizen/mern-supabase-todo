const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
  console.warn('⚠️ Warning: SUPABASE_URL or SUPABASE_KEY is missing or using placeholder values in backend/.env');
}

// Initialize Supabase Client
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

module.exports = supabase;
