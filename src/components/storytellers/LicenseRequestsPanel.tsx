import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLicenseRequests } from "@/hooks/use-community";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function LicenseRequestsPanel() {
  const { incoming, outgoing, loading, refresh } = useLicenseRequests();

  const resolve = async (id: string, status: "approved" | "denied") => {
    const { error } = await supabase
      .from("license_requests")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Request ${status}` });
    refresh();
  };

  const statusBadge = (s: string) => {
    const variant = s === "approved" ? "default" : s === "denied" ? "destructive" : "secondary";
    return <Badge variant={variant as any}>{s}</Badge>;
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading requests...</p>;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Incoming Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {incoming.length === 0 && <p className="text-sm text-muted-foreground">No incoming requests.</p>}
          {incoming.map((r) => (
            <div key={r.id} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{r.story?.title ?? "Story"}</div>
                {statusBadge(r.status)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolve(r.id, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => resolve(r.id, "denied")}>Deny</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {outgoing.length === 0 && <p className="text-sm text-muted-foreground">No outgoing requests.</p>}
          {outgoing.map((r) => (
            <div key={r.id} className="border rounded-md p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{r.story?.title ?? "Story"}</div>
                {statusBadge(r.status)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
