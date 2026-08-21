import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ysvwudazegxcftpdqnfm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzdnd1ZGF6ZWd4Y2Z0cGRxbmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjIyNDUsImV4cCI6MjEwMjczODI0NX0.kdiuncayUXUHRLSWYO7F1jDnxLuPa26zlpr2t4rhz7M";

export const supabase = createClient(supabaseUrl, supabaseKey);