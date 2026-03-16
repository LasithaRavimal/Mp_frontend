import { createClient } from "@supabase/supabase-js";

/*
--------------------------------------------------
SUPABASE CONFIG
--------------------------------------------------
*/

const SUPABASE_URL = "https://pcggmqnvyptjpvolupyf.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZ2dtcW52eXB0anB2b2x1cHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjMyNzMsImV4cCI6MjA4OTEzOTI3M30.eE2JxMf_fONL9sd9kWO1j113VF-Td_RFo_tmlDD_UGk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*
--------------------------------------------------
FILE UPLOAD FUNCTION
--------------------------------------------------
*/

export default async function mediaUpload(file, bucket) {
  try {
    /*
    ----------------------------------------
    VALIDATION
    ----------------------------------------
    */

    if (!file) {
      throw new Error("No file selected");
    }

    if (!bucket) {
      throw new Error("Bucket name missing");
    }

    /*
    ----------------------------------------
    FILE SIZE LIMIT
    ----------------------------------------
    */

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    if (file.size > MAX_SIZE) {
      throw new Error("File too large. Max size is 50MB.");
    }

    /*
    ----------------------------------------
    GENERATE UNIQUE FILE NAME
    ----------------------------------------
    */

    const timestamp = Date.now();
    const safeName = file.name.replace(/\s+/g, "_");
    const fileName = `${timestamp}_${safeName}`;

    /*
    ----------------------------------------
    UPLOAD TO SUPABASE
    ----------------------------------------
    */

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(error.message);
    }

    /*
    ----------------------------------------
    GET PUBLIC URL
    ----------------------------------------
    */

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!data?.publicUrl) {
      throw new Error("Failed to generate public URL");
    }

    return data.publicUrl;

  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
}