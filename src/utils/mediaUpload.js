import { createClient } from "@supabase/supabase-js";

const supabase_url = "https://pcggmqnvyptjpvolupyf.supabase.co";
const anon_key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZ2dtcW52eXB0anB2b2x1cHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjMyNzMsImV4cCI6MjA4OTEzOTI3M30.eE2JxMf_fONL9sd9kWO1j113VF-Td_RFo_tmlDD_UGk";

const supabase = createClient(supabase_url, anon_key);

export default async function mediaUpload(file, bucket) {
  if (!file) {
    throw new Error("No file selected");
  }

  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return data.publicUrl;
}