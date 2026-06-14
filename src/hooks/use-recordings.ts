import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";

export type Recording = Database["public"]["Tables"]["recordings"]["Row"];

export function useRecordings(folderId?: string | null) {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setRecordings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase.from("recordings").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (folderId) q = q.eq("folder_id", folderId);
    const { data, error } = await q;
    if (!error && data) setRecordings(data);
    setLoading(false);
  }, [user, folderId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { recordings, loading, refetch };
}

/**
 * Upload audio/video blob to the (private) recordings bucket.
 * Returns a long-lived signed URL the owner can play back.
 */
export async function uploadRecording(userId: string, blob: Blob, ext: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("recordings").upload(path, blob, {
    upsert: false,
    contentType: blob.type,
  });
  if (error) throw error;
  // Signed URL valid for ~1 year — only the owning user can generate one thanks to RLS.
  const { data, error: signErr } = await supabase.storage
    .from("recordings")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr || !data) throw signErr ?? new Error("Failed to sign recording URL");
  return data.signedUrl;
}
