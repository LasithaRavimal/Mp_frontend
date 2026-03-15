import { createClient } from "@supabase/supabase-js";

const supabase_url = "https://pcggmqnvyptjpvolupyf.supabase.co";
const anon_key = "YOUR_ANON_KEY";

const supabase = createClient(supabase_url, anon_key);

export async function uploadImage(file) {

  if (!file) throw new Error("No file selected");

  const fileName = Date.now() + "-" + file.name;

  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    throw new Error("Image upload failed");
  }

  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}


export async function uploadSong(file) {

  if (!file) throw new Error("No file selected");

  const fileName = Date.now() + "-" + file.name;

  const { error } = await supabase.storage
    .from("songs")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    throw new Error("Song upload failed");
  }

  const { data } = supabase.storage
    .from("songs")
    .getPublicUrl(fileName);

  return data.publicUrl;
}