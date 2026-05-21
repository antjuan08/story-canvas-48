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

/** Upload audio/video blob to the recordings bucket. Returns public URL. */
export async function uploadRecording(userId: string, blob: Blob, ext: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("recordings").upload(path, blob, {
    upsert: false,
    contentType: blob.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("recordings").getPublicUrl(path);
  return data.publicUrl;
}
