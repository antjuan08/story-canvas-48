import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, FileText, Share2 } from "lucide-react";
import { CommunityPost } from "@/hooks/use-community";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function CommunityPostCard({ post, onChanged }: { post: CommunityPost; onChanged: () => void }) {
  const { user } = useAuth();
  const isOwner = user?.id === post.user_id;
  const story = post.story;

  const requestLicense = async () => {
    if (!user || !story) return;
    const { error } = await supabase.from("license_requests").insert({
      story_id: story.id,
      owner_id: story.user_id,
      requester_id: user.id,
    });
    if (error) {
      toast({ title: "Could not send request", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "License request sent" });
  };

  const crossPostToVault = async () => {
    if (!user || !story) return;
    const { error } = await supabase.from("stories").insert({
      user_id: user.id,
      title: `${story.title} (saved)`,
      body: story.body,
      category: story.category,
      tags: story.tags,
      image_url: story.image_url,
      section: "vault",
    });
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved to your Vault" });
  };

  const deletePost = async () => {
    const { error } = await supabase.from("community_posts").delete().eq("id", post.id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Post removed" });
    onChanged();
  };

  const author = post.author;
  const initials = (author?.full_name || "S").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Avatar>
          <AvatarImage src={author?.avatar_url ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium">{author?.full_name || "Storyteller"}</div>
          <div className="text-xs text-muted-foreground">
            {author?.title ? `${author.title} · ` : ""}
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </div>
        </div>
        {isOwner && (
          <Button variant="ghost" size="sm" onClick={deletePost}>
            Remove
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {post.caption && <p className="text-sm">{post.caption}</p>}
        {story ? (
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            {story.image_url && (
              <img src={story.image_url} alt={story.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{story.title}</h3>
              </div>
              {story.body && <p className="text-sm text-muted-foreground line-clamp-3">{story.body}</p>}
              {story.audio_url && <audio src={story.audio_url} controls className="w-full" />}
              {story.video_url && <video src={story.video_url} controls className="w-full rounded" />}
              <div className="flex flex-wrap gap-1">
                {story.category && <Badge variant="secondary">{story.category}</Badge>}
                {story.tags?.slice(0, 5).map((t) => (
                  <Badge key={t} variant="outline">
                    #{t}
                  </Badge>
                ))}
                {story.is_licensable && <Badge>Licensable</Badge>}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Story removed</p>
        )}
        {!isOwner && story && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-1" /> Like
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" /> Comment
            </Button>
            <Button variant="outline" size="sm" onClick={crossPostToVault}>
              <Share2 className="h-4 w-4 mr-1" /> Save to Vault
            </Button>
            {story.is_licensable && (
              <Button size="sm" onClick={requestLicense}>
                Request License
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
